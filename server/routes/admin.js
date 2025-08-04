const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Offer = require('../models/Offer');

const router = express.Router();

// Apply admin authentication to all routes
router.use(auth, adminAuth);

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalOffers = await Offer.countDocuments({ isActive: true });
    const pendingWithdrawals = await Transaction.countDocuments({ 
      type: 'withdrawal', 
      status: 'pending' 
    });

    // Get revenue statistics
    const revenueStats = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get user registration trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const registrationTrend = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Get top users by earnings
    const topUsers = await User.find()
      .sort({ totalEarned: -1 })
      .limit(10)
      .select('username robloxUsername totalEarned balance')
      .lean();

    res.json({
      overview: {
        totalUsers,
        activeUsers,
        totalOffers,
        pendingWithdrawals
      },
      revenue: revenueStats,
      registrationTrend,
      topUsers
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with pagination and filters
router.get('/users', async (req, res) => {
  try {
    const { 
      search, 
      role, 
      isActive, 
      page = 1, 
      limit = 20, 
      sort = 'createdAt', 
      order = 'desc' 
    } = req.query;

    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { robloxUsername: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password').lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user transaction history
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Get user referrals
    const referrals = await User.find({ referredBy: userId })
      .select('username robloxUsername totalEarned createdAt')
      .lean();

    res.json({
      user,
      transactions,
      referrals
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/users/:userId', [
  body('username').optional().isLength({ min: 3, max: 20 }),
  body('email').optional().isEmail(),
  body('balance').optional().isNumeric({ min: 0 }),
  body('role').optional().isIn(['user', 'admin']),
  body('isActive').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { userId } = req.params;
    const updateData = req.body;

    // Don't allow updating sensitive fields directly
    delete updateData.password;
    delete updateData.completedOffers;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Adjust user balance
router.post('/users/:userId/balance', [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('type').isIn(['add', 'subtract']).withMessage('Type must be add or subtract'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { userId } = req.params;
    const { amount, type, reason } = req.body;

    const adjustmentAmount = type === 'add' ? Math.abs(amount) : -Math.abs(amount);

    // Update user balance
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: adjustmentAmount } },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'admin_adjustment',
      amount: adjustmentAmount,
      status: 'completed',
      description: `Admin balance adjustment: ${reason}`,
      metadata: {
        adminNote: reason,
        adjustedBy: req.user._id
      },
      processedAt: new Date()
    });

    await transaction.save();

    res.json({
      message: 'Balance adjusted successfully',
      user: {
        id: user._id,
        username: user.username,
        balance: user.balance
      },
      transaction
    });
  } catch (error) {
    console.error('Adjust balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all transactions with filters
router.get('/transactions', async (req, res) => {
  try {
    const { 
      type, 
      status, 
      userId, 
      page = 1, 
      limit = 20, 
      sort = 'createdAt', 
      order = 'desc' 
    } = req.query;

    const query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (userId) {
      query.userId = userId;
    }

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(query)
      .populate('userId', 'username email robloxUsername')
      .sort(sortObj)
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
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process withdrawal
router.put('/transactions/:transactionId/process', [
  body('status').isIn(['completed', 'failed']).withMessage('Status must be completed or failed'),
  body('failureReason').optional().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { transactionId } = req.params;
    const { status, failureReason } = req.body;

    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction is not pending' });
    }

    // If withdrawal failed, refund the user
    if (status === 'failed' && transaction.type === 'withdrawal') {
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: {
          balance: Math.abs(transaction.amount),
          totalWithdrawn: -Math.abs(transaction.amount)
        }
      });
    }

    transaction.status = status;
    transaction.processedAt = new Date();
    
    if (failureReason) {
      transaction.failureReason = failureReason;
    }

    await transaction.save();

    res.json({
      message: `Transaction ${status} successfully`,
      transaction
    });
  } catch (error) {
    console.error('Process transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get offers management
router.get('/offers', async (req, res) => {
  try {
    const { 
      provider, 
      category, 
      isActive, 
      page = 1, 
      limit = 20, 
      sort = 'createdAt', 
      order = 'desc' 
    } = req.query;

    const query = {};
    
    if (provider) {
      query.provider = provider;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const sortObj = {};
    sortObj[sort] = order === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const offers = await Offer.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Offer.countDocuments(query);

    res.json({
      offers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle offer status
router.put('/offers/:offerId/toggle', async (req, res) => {
  try {
    const { offerId } = req.params;

    const offer = await Offer.findOne({ offerId });
    
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    res.json({
      message: `Offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
      offer: {
        offerId: offer.offerId,
        title: offer.title,
        isActive: offer.isActive
      }
    });
  } catch (error) {
    console.error('Toggle offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create manual offer
router.post('/offers', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('reward').isNumeric({ min: 1 }).withMessage('Reward must be at least 1'),
  body('category').isIn(['survey', 'app_download', 'game', 'signup', 'purchase', 'video', 'other']),
  body('estimatedTime').isNumeric({ min: 1 }).withMessage('Estimated time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const offerData = {
      ...req.body,
      offerId: `manual_${Date.now()}`,
      provider: 'manual',
      clickUrl: req.body.clickUrl || '#',
      countries: req.body.countries || ['US'],
      devices: req.body.devices || ['desktop', 'mobile']
    };

    const offer = new Offer(offerData);
    await offer.save();

    res.status(201).json({
      message: 'Offer created successfully',
      offer
    });
  } catch (error) {
    console.error('Create offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;