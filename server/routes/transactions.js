const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const axios = require('axios');

const router = express.Router();

// Get user transaction history
router.get('/history', auth, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    const query = { userId };
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request withdrawal
router.post('/withdraw', auth, [
  body('amount').isInt({ min: 100 }).withMessage('Minimum withdrawal is 100 Robux'),
  body('method').isIn(['roblox']).withMessage('Invalid withdrawal method'),
  body('robloxGamepassId').optional().isString().withMessage('Invalid gamepass ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { amount, method, robloxGamepassId } = req.body;
    const userId = req.user._id;

    // Check if user has sufficient balance
    if (req.user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Check for pending withdrawals
    const pendingWithdrawal = await Transaction.findOne({
      userId,
      type: 'withdrawal',
      status: 'pending'
    });

    if (pendingWithdrawal) {
      return res.status(400).json({ message: 'You have a pending withdrawal request' });
    }

    // Create withdrawal transaction
    const transaction = new Transaction({
      userId,
      type: 'withdrawal',
      amount: -amount, // Negative for withdrawal
      method,
      description: `Withdrawal of ${amount} Robux via ${method}`,
      metadata: {
        robloxGamepassId
      }
    });

    await transaction.save();

    // Deduct amount from user balance
    await User.findByIdAndUpdate(userId, {
      $inc: {
        balance: -amount,
        totalWithdrawn: amount
      }
    });

    res.json({
      message: 'Withdrawal request submitted successfully',
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deposit via PayPal (placeholder for real integration)
router.post('/deposit', auth, [
  body('amount').isFloat({ min: 1 }).withMessage('Minimum deposit is $1'),
  body('method').isIn(['paypal', 'crypto']).withMessage('Invalid deposit method')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { amount, method } = req.body;
    const userId = req.user._id;

    // Calculate Robux amount (1 USD = 80 Robux)
    const robuxAmount = Math.floor(amount * 80);

    // Create deposit transaction
    const transaction = new Transaction({
      userId,
      type: 'deposit',
      amount: robuxAmount,
      method,
      description: `Deposit of $${amount} (${robuxAmount} Robux) via ${method}`,
      status: 'pending'
    });

    await transaction.save();

    // In a real application, you would integrate with PayPal/Stripe here
    // For demo purposes, we'll just return a mock payment URL
    let paymentUrl;
    
    if (method === 'paypal') {
      paymentUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=MOCK_TOKEN_${transaction._id}`;
    } else if (method === 'crypto') {
      paymentUrl = `https://commerce.coinbase.com/checkout/MOCK_CHECKOUT_${transaction._id}`;
    }

    res.json({
      message: 'Deposit initiated successfully',
      paymentUrl,
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get withdrawal methods and minimum amounts
router.get('/withdrawal-methods', auth, async (req, res) => {
  try {
    const methods = [
      {
        id: 'roblox',
        name: 'Roblox Gamepass',
        description: 'Purchase a gamepass to receive Robux',
        minimum: 100,
        fee: 0,
        processingTime: '24-48 hours',
        requirements: [
          'Minimum 100 Robux',
          'Valid Roblox gamepass ID',
          'Account must be verified'
        ]
      }
    ];

    res.json({ methods });
  } catch (error) {
    console.error('Get withdrawal methods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get deposit methods and rates
router.get('/deposit-methods', auth, async (req, res) => {
  try {
    const methods = [
      {
        id: 'paypal',
        name: 'PayPal',
        description: 'Pay with PayPal account or credit card',
        rate: 80, // Robux per USD
        minimum: 1,
        fee: 0.05, // 5% fee
        processingTime: 'Instant',
        supported: true
      },
      {
        id: 'crypto',
        name: 'Cryptocurrency',
        description: 'Pay with Bitcoin, Ethereum, or other cryptocurrencies',
        rate: 85, // Robux per USD (better rate)
        minimum: 5,
        fee: 0.03, // 3% fee
        processingTime: '10-30 minutes',
        supported: true
      }
    ];

    res.json({ methods });
  } catch (error) {
    console.error('Get deposit methods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel pending transaction
router.put('/:transactionId/cancel', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user._id;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId,
      status: 'pending'
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found or cannot be cancelled' });
    }

    // If it's a withdrawal, refund the amount
    if (transaction.type === 'withdrawal') {
      await User.findByIdAndUpdate(userId, {
        $inc: {
          balance: Math.abs(transaction.amount),
          totalWithdrawn: -Math.abs(transaction.amount)
        }
      });
    }

    transaction.status = 'cancelled';
    await transaction.save();

    res.json({
      message: 'Transaction cancelled successfully',
      transaction: {
        id: transaction._id,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Cancel transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    const formattedStats = {
      totalEarnings: 0,
      totalWithdrawals: 0,
      totalDeposits: 0,
      offerCompletions: 0,
      referralEarnings: 0,
      pendingWithdrawals: 0
    };

    stats.forEach(stat => {
      switch (stat._id) {
        case 'offer_completion':
          formattedStats.totalEarnings += stat.total;
          formattedStats.offerCompletions = stat.count;
          break;
        case 'withdrawal':
          formattedStats.totalWithdrawals += Math.abs(stat.total);
          break;
        case 'deposit':
          formattedStats.totalDeposits += stat.total;
          break;
        case 'referral_bonus':
          formattedStats.referralEarnings += stat.total;
          break;
      }
    });

    // Get pending withdrawals
    const pendingWithdrawals = await Transaction.find({
      userId,
      type: 'withdrawal',
      status: 'pending'
    });

    formattedStats.pendingWithdrawals = pendingWithdrawals.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    res.json({ stats: formattedStats });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;