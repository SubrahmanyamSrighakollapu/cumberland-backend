import db from "../config/database.js";
import { sendSuccess, sendError } from "../utils/response.js";

export const getStats = async (req, res) => {
  try {
    const [roomRows] = await db.query("SELECT COUNT(*) as count FROM rooms");
    const [galleryRows] = await db.query(
      "SELECT COUNT(*) as count FROM gallery_media"
    );
    const [testimonialRows] = await db.query(
      "SELECT COUNT(*) as count FROM testimonials"
    );
    const [amenityRows] = await db.query(
      "SELECT COUNT(*) as count FROM amenities"
    );
    const [wineryRows] = await db.query(
      "SELECT COUNT(*) as count FROM wineries"
    );
    const [venueRows] = await db.query(
      "SELECT COUNT(*) as count FROM dining_venues"
    );
    const [activityRows] = await db.query(
      "SELECT COUNT(*) as count FROM activities"
    );
    const [inquiryRows] = await db.query(
      "SELECT COUNT(*) as count FROM contact_inquiries WHERE status = 'new'"
    );

    return sendSuccess(
      res,
      {
        rooms: roomRows[0].count,
        gallery: galleryRows[0].count,
        testimonials: testimonialRows[0].count,
        amenities: amenityRows[0].count,
        wineries: wineryRows[0].count,
        diningVenues: venueRows[0].count,
        activities: activityRows[0].count,
        newInquiries: inquiryRows[0].count,
      },
      "Dashboard stats retrieved"
    );
  } catch (err) {
    console.error("Stats error:", err);
    return sendError(res, "Failed to load dashboard stats.", 500);
  }
};
