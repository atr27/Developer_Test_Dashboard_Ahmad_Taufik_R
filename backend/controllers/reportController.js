const db = require('../config/db');

exports.getFilterOptions = async (req, res) => {
    try {
        const [areas] = await db.query('SELECT area_id, area_name FROM store_area');
        res.json({ areas });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReportData = async (req, res) => {
    try {
        const { area_ids, date_from, date_to } = req.query;

        // Base Query: Join semua tabel terkait
        let query = `
            SELECT 
                sa.area_id,
                sa.area_name,
                pb.brand_name,
                SUM(rp.compliance) as total_compliance,
                COUNT(*) as total_rows
            FROM report_product rp
            JOIN store s ON rp.store_id = s.store_id
            JOIN store_area sa ON s.area_id = sa.area_id
            JOIN product p ON rp.product_id = p.product_id
            JOIN product_brand pb ON p.brand_id = pb.brand_id
            WHERE 1=1
        `;

        const params = [];

        // Filter Area (Multiple Select)
        if (area_ids) {
            // Handle jika area_ids dikirim sebagai array atau single string
            const ids = Array.isArray(area_ids) ? area_ids : [area_ids];
            const placeholders = ids.map(() => '?').join(',');
            query += ` AND s.area_id IN (${placeholders})`;
            params.push(...ids);
        }

        // Filter Tanggal Dari
        if (date_from) {
            query += ` AND rp.tanggal >= ?`;
            params.push(date_from);
        }

        // Filter Tanggal Sampai
        if (date_to) {
            query += ` AND rp.tanggal <= ?`;
            params.push(date_to);
        }

        // Grouping untuk memudahkan pengolahan di Frontend
        query += ` GROUP BY sa.area_id, sa.area_name, pb.brand_id, pb.brand_name`;

        const [rows] = await db.query(query, params);

        // Kalkulasi Persentase per baris data
        const processedData = rows.map(row => ({
            ...row,
            nilai: Math.round((row.total_compliance / row.total_rows) * 100)
        }));

        res.json(processedData);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};