const ads = require("../models/ads");


// Add or Update Ad Banner (Only one banner allowed)
exports.addBanner = async (req, res) => {
    const { imageUrl, link } = req.body;
    await ads.deleteMany({}); // Ensure only one banner exists
    const newAdBanner = new ads({ imageUrl, link });
    await newAdBanner.save();
    res.json({ message: "Ad Banner added/updated successfully", adBanner: newAdBanner });
};

// Get Ad Banner
exports.getBanner = async (req, res) => {
    const adBanner = await ads.findOne();
    if (!adBanner) return res.status(404).json({ message: "No ad banner found" });
    res.json(adBanner);
};
