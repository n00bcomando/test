const express = require('express');
const axios = require('axios');
const { auth, optionalAuth } = require('../middleware/auth');
const Offer = require('../models/Offer');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Get all available offers
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, provider, sort = 'reward', order = 'desc', page = 1, limit = 20 } = req.query;
    
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (provider) {
      query.provider = provider;
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

    // Add user completion status if authenticated
    if (req.user) {
      const completedOfferIds = req.user.completedOffers.map(o => o.offerId);
      offers.forEach(offer => {
        offer.completed = completedOfferIds.includes(offer.offerId);
      });
    }

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

// Get offer categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Offer.distinct('category', { isActive: true });
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get offer providers
router.get('/providers', async (req, res) => {
  try {
    const providers = await Offer.distinct('provider', { isActive: true });
    res.json({ providers });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific offer details
router.get('/:offerId', optionalAuth, async (req, res) => {
  try {
    const { offerId } = req.params;
    
    const offer = await Offer.findOne({ offerId, isActive: true }).lean();
    
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user has completed this offer
    if (req.user) {
      const completedOffer = req.user.completedOffers.find(o => o.offerId === offerId);
      offer.completed = !!completedOffer;
      if (completedOffer) {
        offer.completedAt = completedOffer.completedAt;
      }
    }

    res.json({ offer });
  } catch (error) {
    console.error('Get offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start offer (generate tracking link)
router.post('/:offerId/start', auth, async (req, res) => {
  try {
    const { offerId } = req.params;
    const userId = req.user._id;

    const offer = await Offer.findOne({ offerId, isActive: true });
    
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    // Check if user already completed this offer
    const completedOffer = req.user.completedOffers.find(o => o.offerId === offerId);
    if (completedOffer) {
      return res.status(400).json({ message: 'Offer already completed' });
    }

    // Generate tracking URL with user ID
    let trackingUrl = offer.clickUrl;
    
    // Add user tracking parameters based on provider
    switch (offer.provider) {
      case 'adgate':
        trackingUrl += `&subid1=${userId}&subid2=${offerId}`;
        break;
      case 'offertoro':
        trackingUrl += `&user_id=${userId}&offer_id=${offerId}`;
        break;
      case 'cpxresearch':
        trackingUrl += `&ext_user_id=${userId}&transaction_id=${offerId}`;
        break;
      default:
        trackingUrl += `&uid=${userId}&oid=${offerId}`;
    }

    res.json({
      trackingUrl,
      message: 'Offer started successfully'
    });
  } catch (error) {
    console.error('Start offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sync offers from external APIs (Admin function)
router.post('/sync', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const syncResults = {
      adgate: 0,
      offertoro: 0,
      cpxresearch: 0,
      errors: []
    };

    // Sync AdGate offers
    try {
      if (process.env.ADGATE_API_KEY) {
        const adgateResponse = await axios.get(`https://wall.adgaterewards.com/api/v2/${process.env.ADGATE_API_KEY}/offers`);
        
        for (const offer of adgateResponse.data.data) {
          await Offer.findOneAndUpdate(
            { offerId: offer.id.toString(), provider: 'adgate' },
            {
              offerId: offer.id.toString(),
              provider: 'adgate',
              title: offer.name,
              description: offer.description || offer.requirements,
              reward: Math.round(offer.points * 0.1), // Convert points to robux
              category: mapCategory(offer.category),
              estimatedTime: offer.time_to_complete || 10,
              requirements: offer.requirements,
              countries: offer.countries || ['US'],
              devices: offer.device_type ? [offer.device_type] : ['desktop', 'mobile'],
              clickUrl: offer.click_url,
              imageUrl: offer.icon_url,
              isActive: true,
              lastUpdated: new Date()
            },
            { upsert: true, new: true }
          );
          syncResults.adgate++;
        }
      }
    } catch (error) {
      syncResults.errors.push(`AdGate sync failed: ${error.message}`);
    }

    // Sync OfferToro offers
    try {
      if (process.env.OFFERTORO_API_KEY) {
        const offertoroResponse = await axios.get(`https://www.offertoro.com/api/v1/offers/${process.env.OFFERTORO_API_KEY}`);
        
        for (const offer of offertoroResponse.data.offers) {
          await Offer.findOneAndUpdate(
            { offerId: offer.offer_id.toString(), provider: 'offertoro' },
            {
              offerId: offer.offer_id.toString(),
              provider: 'offertoro',
              title: offer.offer_name,
              description: offer.offer_desc,
              reward: Math.round(offer.amount_rewarded * 0.1),
              category: mapCategory(offer.vertical),
              estimatedTime: offer.time_to_complete || 15,
              requirements: offer.instructions,
              countries: offer.countries ? offer.countries.split(',') : ['US'],
              devices: ['desktop', 'mobile'],
              clickUrl: offer.offer_url,
              imageUrl: offer.image,
              isActive: true,
              lastUpdated: new Date()
            },
            { upsert: true, new: true }
          );
          syncResults.offertoro++;
        }
      }
    } catch (error) {
      syncResults.errors.push(`OfferToro sync failed: ${error.message}`);
    }

    // Sync CPX Research offers (surveys)
    try {
      if (process.env.CPXRESEARCH_API_KEY) {
        const cpxResponse = await axios.get(`https://offers.cpx-research.com/index.php`, {
          params: {
            app_id: process.env.CPXRESEARCH_API_KEY,
            ext_user_id: 'sync',
            format: 'json'
          }
        });
        
        if (cpxResponse.data.surveys) {
          for (const survey of cpxResponse.data.surveys) {
            await Offer.findOneAndUpdate(
              { offerId: survey.id.toString(), provider: 'cpxresearch' },
              {
                offerId: survey.id.toString(),
                provider: 'cpxresearch',
                title: survey.title || 'Survey',
                description: survey.description || 'Complete this survey to earn rewards',
                reward: Math.round(survey.payout * 0.1),
                category: 'survey',
                estimatedTime: survey.loi || 10,
                requirements: 'Complete the survey honestly',
                countries: survey.countries ? survey.countries.split(',') : ['US'],
                devices: ['desktop', 'mobile'],
                clickUrl: survey.click_url,
                isActive: true,
                lastUpdated: new Date()
              },
              { upsert: true, new: true }
            );
            syncResults.cpxresearch++;
          }
        }
      }
    } catch (error) {
      syncResults.errors.push(`CPX Research sync failed: ${error.message}`);
    }

    res.json({
      message: 'Offers synced successfully',
      results: syncResults
    });
  } catch (error) {
    console.error('Sync offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to map categories
function mapCategory(category) {
  const categoryMap = {
    'surveys': 'survey',
    'mobile_apps': 'app_download',
    'games': 'game',
    'signups': 'signup',
    'shopping': 'purchase',
    'videos': 'video',
    'download': 'app_download',
    'install': 'app_download',
    'register': 'signup',
    'email_submit': 'signup'
  };

  const lowerCategory = category?.toLowerCase() || '';
  return categoryMap[lowerCategory] || 'other';
}

module.exports = router;