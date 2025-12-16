const { db } = require('../config/database');

// GET /api/mahasiswa - List semua mahasiswa (untuk admin)
const getAllMahasiswa = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Base query
        let query = `
            SELECT 
                m.id,
                m.nim,
                m.full_name,
                m.jurusan,
                m.phone_number,
                u.identity_number,
                u.username,
                u.is_active,
                u.created_at,
                COUNT(l.laporan_id) as total_laporan
            FROM mahasiswa m
            INNER JOIN users u ON m.user_id = u.id
            LEFT JOIN laporan l ON m.id = l.mahasiswa_id
            WHERE u.role = 'mahasiswa'
        `;

        const params = [];

        // Filter by status
        if (status === 'aktif') {
            query += ` AND u.is_active = 1`;
        } else if (status === 'nonaktif') {
            query += ` AND u.is_active = 0`;
        }

        // Search by nama, NIM, atau jurusan
        if (search && search.trim() !== '') {
            query += ` AND (m.full_name LIKE ? OR m.nim LIKE ? OR m.jurusan LIKE ?)`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        // Convert to number and inline LIMIT/OFFSET (not parameterized)
        const limitNum = Number(limit) || 10;
        const offsetNum = Number(offset) || 0;

        query += ` GROUP BY m.id, u.id`;
        query += ` ORDER BY u.created_at DESC`;
        query += ` LIMIT ${limitNum} OFFSET ${offsetNum}`;

        const [rows] = await db.execute(query, params);

        // Get total count
        let countQuery = `
            SELECT COUNT(DISTINCT m.id) as total
            FROM mahasiswa m
            INNER JOIN users u ON m.user_id = u.id
            WHERE u.role = 'mahasiswa'
        `;
        const countParams = [];

        if (status === 'aktif') {
            countQuery += ` AND u.is_active = 1`;
        } else if (status === 'nonaktif') {
            countQuery += ` AND u.is_active = 0`;
        }

        if (search && search.trim() !== '') {
            countQuery += ` AND (m.full_name LIKE ? OR m.nim LIKE ? OR m.jurusan LIKE ?)`;
            const searchPattern = `%${search}%`;
            countParams.push(searchPattern, searchPattern, searchPattern);
        }

        const [countResult] = await db.execute(countQuery, countParams);
        const total = countResult[0].total;

        res.json({
            message: 'Berhasil mengambil data mahasiswa',
            data: rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error getAllMahasiswa:', error);
        res.status(500).json({ 
            message: 'Server Error', 
            error: error.message 
        });
    }
};

// GET /api/mahasiswa/stats - Statistik mahasiswa
const getMahasiswaStats = async (req, res) => {
    try {
        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN u.is_active = 1 THEN 1 ELSE 0 END) as aktif,
                SUM(CASE WHEN u.is_active = 0 THEN 1 ELSE 0 END) as nonaktif
            FROM mahasiswa m
            INNER JOIN users u ON m.user_id = u.id
            WHERE u.role = 'mahasiswa'
        `;

        const [rows] = await db.execute(query);

        res.json({
            message: 'Berhasil mengambil statistik mahasiswa',
            stats: rows[0]
        });

    } catch (error) {
        console.error('Error getMahasiswaStats:', error);
        res.status(500).json({ 
            message: 'Server Error', 
            error: error.message 
        });
    }
};

// GET /api/mahasiswa/:id - Detail mahasiswa
const getMahasiswaById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                m.id,
                m.nim,
                m.full_name,
                m.jurusan,
                m.phone_number,
                u.id as user_id,
                u.identity_number,
                u.username,
                u.is_active,
                u.created_at
            FROM mahasiswa m
            INNER JOIN users u ON m.user_id = u.id
            WHERE m.id = ?
        `;

        const [rows] = await db.execute(query, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ 
                message: 'Mahasiswa tidak ditemukan' 
            });
        }

        // Get laporan mahasiswa
        const [laporanRows] = await db.execute(
            `SELECT 
                laporan_id,
                jenis_kekerasan,
                status,
                tanggal
            FROM laporan
            WHERE mahasiswa_id = ?
            ORDER BY tanggal DESC`,
            [id]
        );

        res.json({
            message: 'Berhasil mengambil detail mahasiswa',
            data: {
                ...rows[0],
                total_laporan: laporanRows.length,
                laporan: laporanRows
            }
        });

    } catch (error) {
        console.error('Error getMahasiswaById:', error);
        res.status(500).json({ 
            message: 'Server Error', 
            error: error.message 
        });
    }
};

module.exports = {
    getAllMahasiswa,
    getMahasiswaStats,
    getMahasiswaById
};
