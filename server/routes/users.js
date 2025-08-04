const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Get user leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50, type = 'earnings' } = req.query;

    let sortField;
    switch (type) {
      case 'earnings':
        sortField = 'totalEarned';
        break;
      case 'referrals':
        sortField = 'referralEarnings';
        break;
      case 'withdrawals':
        sortField = 'totalWithdrawn';
        break;
      default:
        sortField = 'totalEarned';
    }

    const users = await User.find({ 
      isActive: true,
      'settings.privateProfile': { $ne: true }
    })
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .select('username robloxUsername totalEarned totalWithdrawn referralEarnings avatar createdAt')
      .lean();

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      robloxUsername: user.robloxUsername,
      totalEarned: user.totalEarned,
      totalWithdrawn: user.totalWithdrawn,
      referralEarnings: user.referralEarnings,
      avatar: user.avatar,
      joinedAt: user.createdAt
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user rank
router.get('/rank', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const higherRankedUsers = await User.countDocuments({
      totalEarned: { $gt: req.user.totalEarned },
      isActive: true
    });

    const rank = higherRankedUsers + 1;

    res.json({ rank });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get referral information
router.get('/referrals', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get direct referrals
    const referrals = await User.find({ referredBy: userId })
      .select('username robloxUsername totalEarned createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate referral stats
    const referralStats = {
      totalReferrals: referrals.length,
      totalEarnings: req.user.referralEarnings,
      referralRate: referrals.length > 0 ? 
        (referrals.filter(r => r.totalEarned > 0).length / referrals.length * 100).toFixed(1) : 0
    };

    // Get recent referral transactions
    const referralTransactions = await Transaction.find({
      userId,
      type: 'referral_bonus'
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      referralCode: req.user.referralCode,
      referralStats,
      referrals,
      recentTransactions: referralTransactions
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by referral code
router.get('/referral/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const user = await User.findOne({ referralCode: code })
      .select('username robloxUsername totalEarned createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Referral code not found' });
    }

    res.json({
      referrer: {
        username: user.username,
        robloxUsername: user.robloxUsername,
        totalEarned: user.totalEarned,
        joinedAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get referral user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user activity feed
router.get('/activity', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    // Get recent transactions as activity
    const activities = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Format activities for display
    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      type: activity.type,
      amount: activity.amount,
      description: activity.description,
      status: activity.status,
      createdAt: activity.createdAt,
      metadata: activity.metadata
    }));

    const total = await Transaction.countDocuments({ userId });

    res.json({
      activities: formattedActivities,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users (for admin purposes or public profiles)
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { robloxUsername: { $regex: q, $options: 'i' } }
          ]
        },
        { isActive: true },
        { 'settings.privateProfile': { $ne: true } }
      ]
    })
      .select('username robloxUsername totalEarned avatar')
      .limit(parseInt(limit))
      .lean();

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public user profile
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ 
      username,
      isActive: true,
      'settings.privateProfile': { $ne: true }
    })
      .select('username robloxUsername totalEarned totalWithdrawn avatar createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found or profile is private' });
    }

    // Get user's rank
    const higherRankedUsers = await User.countDocuments({
      totalEarned: { $gt: user.totalEarned },
      isActive: true
    });

    const rank = higherRankedUsers + 1;

    // Get recent public achievements (optional)
    const recentEarnings = await Transaction.find({
      userId: user._id,
      type: 'offer_completion',
      status: 'completed'
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('amount description createdAt')
      .lean();

    res.json({
      profile: {
        username: user.username,
        robloxUsername: user.robloxUsername,
        totalEarned: user.totalEarned,
        totalWithdrawn: user.totalWithdrawn,
        avatar: user.avatar,
        joinedAt: user.createdAt,
        rank
      },
      recentEarnings
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate new referral code
router.post('/referral-code/regenerate', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Generate new unique referral code
    let newCode;
    let isUnique = false;
    
    while (!isUnique) {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      newCode = '';
      for (let i = 0; i < 8; i++) {
        newCode += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      const existingUser = await User.findOne({ referralCode: newCode });
      if (!existingUser) {
        isUnique = true;
      }
    }

    // Update user's referral code
    await User.findByIdAndUpdate(userId, { referralCode: newCode });

    res.json({
      message: 'Referral code regenerated successfully',
      referralCode: newCode
    });
  } catch (error) {
    console.error('Regenerate referral code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;