const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Offer = require('../models/Offer');

const router = express.Router();

// AdGate webhook handler
router.post('/adgate', async (req, res) => {
  try {
    const { 
      user_id, 
      offer_id, 
      amount, 
      status,
      transaction_id,
      signature 
    } = req.body;

    // Verify signature (in production, implement proper signature verification)
    // const expectedSignature = crypto.createHmac('sha256', process.env.ADGATE_SECRET_KEY)
    //   .update(JSON.stringify(req.body))
    //   .digest('hex');

    // if (signature !== expectedSignature) {
    //   return res.status(401).json({ message: 'Invalid signature' });
    // }

    if (status === 'completed') {
      await processOfferCompletion({
        userId: user_id,
        offerId: offer_id,
        amount: Math.round(amount * 0.1), // Convert to Robux
        provider: 'adgate',
        transactionId: transaction_id
      });
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('AdGate webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// OfferToro webhook handler
router.post('/offertoro', async (req, res) => {
  try {
    const { 
      user_id, 
      offer_id, 
      amount_rewarded, 
      status,
      oid,
      signature 
    } = req.body;

    // Verify signature in production
    if (status === '1') { // OfferToro uses '1' for completed
      await processOfferCompletion({
        userId: user_id,
        offerId: offer_id,
        amount: Math.round(amount_rewarded * 0.1),
        provider: 'offertoro',
        transactionId: oid
      });
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('OfferToro webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// CPX Research webhook handler
router.post('/cpxresearch', async (req, res) => {
  try {
    const { 
      ext_user_id, 
      transaction_id, 
      reward, 
      status,
      signature 
    } = req.body;

    if (status === 'completed') {
      await processOfferCompletion({
        userId: ext_user_id,
        offerId: transaction_id,
        amount: Math.round(reward * 0.1),
        provider: 'cpxresearch',
        transactionId: transaction_id
      });
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('CPX Research webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Generic webhook handler for testing
router.post('/test', async (req, res) => {
  try {
    const { userId, offerId, amount } = req.body;

    await processOfferCompletion({
      userId,
      offerId,
      amount,
      provider: 'test',
      transactionId: `test_${Date.now()}`
    });

    res.json({ 
      status: 'success',
      message: 'Test offer completion processed'
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// Helper function to process offer completion
async function processOfferCompletion({ userId, offerId, amount, provider, transactionId }) {
  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      return;
    }

    // Check if this offer completion already exists
    const existingCompletion = user.completedOffers.find(
      offer => offer.offerId === offerId && offer.provider === provider
    );

    if (existingCompletion) {
      console.log(`Offer ${offerId} already completed by user ${userId}`);
      return;
    }

    // Find the offer
    const offer = await Offer.findOne({ offerId, provider });
    
    // Use the offer's reward amount if available, otherwise use webhook amount
    const rewardAmount = offer ? offer.reward : amount;

    // Add to user's completed offers
    user.completedOffers.push({
      offerId,
      provider,
      amount: rewardAmount,
      completedAt: new Date()
    });

    // Update user balance and total earned
    user.balance += rewardAmount;
    user.totalEarned += rewardAmount;

    await user.save();

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'offer_completion',
      amount: rewardAmount,
      status: 'completed',
      description: offer ? 
        `Completed offer: ${offer.title}` : 
        `Completed offer ${offerId}`,
      metadata: {
        offerId,
        offerProvider: provider,
        externalTransactionId: transactionId
      },
      processedAt: new Date()
    });

    await transaction.save();

    // Update offer completion count
    if (offer) {
      offer.completions += 1;
      await offer.save();
    }

    // Process referral bonus if user was referred
    if (user.referredBy) {
      const referrer = await User.findById(user.referredBy);
      if (referrer) {
        const referralBonus = Math.round(rewardAmount * 0.1); // 10% referral bonus
        
        referrer.balance += referralBonus;
        referrer.referralEarnings += referralBonus;
        await referrer.save();

        // Create referral transaction
        const referralTransaction = new Transaction({
          userId: referrer._id,
          type: 'referral_bonus',
          amount: referralBonus,
          status: 'completed',
          description: `Referral bonus from ${user.username}`,
          metadata: {
            referralUserId: userId,
            originalOfferId: offerId,
            originalProvider: provider
          },
          processedAt: new Date()
        });

        await referralTransaction.save();
      }
    }

    console.log(`Offer completion processed: User ${userId}, Offer ${offerId}, Amount ${rewardAmount}`);
  } catch (error) {
    console.error('Error processing offer completion:', error);
    throw error;
  }
}

module.exports = router;