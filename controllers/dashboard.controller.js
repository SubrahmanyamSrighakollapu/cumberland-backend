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
    const [inquiryRows] = await db.query(
      "SELECT COUNT(*) as count FROM contact_inquiries WHERE status = 'new'"
    );

    return sendSuccess(
      res,
      {
        rooms: roomRows[0]?.count || 0,
        gallery: galleryRows[0]?.count || 0,
        testimonials: testimonialRows[0]?.count || 0,
        amenities: amenityRows[0]?.count || 0,
        wineries: 0,
        diningVenues: 0,
        activities: 0,
        newInquiries: inquiryRows[0]?.count || 0,
      },
      "Dashboard stats retrieved"
    );
  } catch (err) {
    console.error("Stats error:", err);
    return sendError(res, "Failed to load dashboard stats.", 500);
  }
};

