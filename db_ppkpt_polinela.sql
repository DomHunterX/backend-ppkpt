-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 16, 2025 at 02:54 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_ppkpt_polinela`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `user_id`, `full_name`, `phone_number`) VALUES
(1, 3, 'Admin Satgas 1', '081234567891'),
(2, 4, 'Admin Satgas 2', '081234567892');

-- --------------------------------------------------------

--
-- Table structure for table `aktivitas`
--

CREATE TABLE `aktivitas` (
  `aktivitas_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `judul` varchar(255) NOT NULL,
  `media` varchar(255) DEFAULT NULL,
  `konten` text NOT NULL,
  `tanggal` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `edukasi`
--

CREATE TABLE `edukasi` (
  `edukasi_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `judul` varchar(255) DEFAULT NULL,
  `Media` varchar(255) DEFAULT NULL,
  `konten` text DEFAULT NULL,
  `tanggal` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `laporan`
--

CREATE TABLE `laporan` (
  `laporan_id` int(11) NOT NULL,
  `mahasiswa_id` int(11) NOT NULL,
  `nama` varchar(255) DEFAULT NULL,
  `nomor_telepon` varchar(20) DEFAULT NULL,
  `domisili` varchar(255) DEFAULT NULL,
  `tanggal` date NOT NULL,
  `jenis_kekerasan` varchar(255) DEFAULT NULL,
  `cerita_peristiwa` text DEFAULT NULL,
  `pelampiran_bukti` text DEFAULT NULL,
  `disabilitas` enum('YA','TIDAK') DEFAULT NULL,
  `status_pelapor` enum('Mahasiswa','Pendidik','Staff/Teknisi','Warga Kampus','Masyarakat Umum') DEFAULT NULL,
  `alasan` enum('Saya seorang korban yang memerlukan bantuan pemulihan','Saya seorang saksi yang khawatir dengan keadaan korban','Saya ingin perguruan tinggi menindak tegas terlapor','Warga Kampus') DEFAULT NULL,
  `alasan_lainnya` text DEFAULT NULL,
  `pendampingan` enum('YA','TIDAK') DEFAULT NULL,
  `status` enum('Dalam Proses','Verifikasi','Proses Lanjutan','Selesai','Ditolak') DEFAULT 'Dalam Proses',
  `catatan_tindak_lanjut` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `laporan`
--

INSERT INTO `laporan` (`laporan_id`, `mahasiswa_id`, `nama`, `nomor_telepon`, `domisili`, `tanggal`, `jenis_kekerasan`, `cerita_peristiwa`, `pelampiran_bukti`, `disabilitas`, `status_pelapor`, `alasan`, `alasan_lainnya`, `pendampingan`, `status`, `catatan_tindak_lanjut`) VALUES
(24, 2, 'owi', '123456789', 'adafsacwsd', '2025-12-16', 'dituduh ijazah palsu', 'adadasdad', NULL, 'TIDAK', 'Mahasiswa', 'Saya seorang korban yang memerlukan bantuan pemulihan', '\n\nDiverifikasi oleh Admin: boong gada bukti', 'TIDAK', '', NULL),
(25, 1, 'abang roy', '12345678', 'sddsfsfsfd', '2025-12-15', 'adasdasd', 'dasdada', NULL, 'YA', 'Pendidik', 'Saya seorang saksi yang khawatir dengan keadaan korban', NULL, 'YA', 'Ditolak', 'maksa amat ijazah palsu');

--
-- Triggers `laporan`
--
DELIMITER $$
CREATE TRIGGER `trg_after_insert_laporan` AFTER INSERT ON `laporan` FOR EACH ROW BEGIN
    INSERT INTO riwayat_laporan (
        laporan_id,
        pelapor_id,
        pelapor_role,
        aksi,
        status_baru,
        catatan
    ) VALUES (
        NEW.laporan_id,
        NEW.mahasiswa_id,
        COALESCE(NEW.status_pelapor, 'Masyarakat Umum'),
        'Laporan Dibuat',
        NEW.status,
        NEW.catatan_tindak_lanjut
    );
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_after_update_laporan` AFTER UPDATE ON `laporan` FOR EACH ROW BEGIN
    -- 1) Jika status berubah -> catat 'Status Diubah'
    IF NOT (OLD.status <=> NEW.status) THEN
        INSERT INTO riwayat_laporan (
            laporan_id,
            pelapor_id,
            pelapor_role,
            aksi,
            status_sebelumnya,
            status_baru,
            catatan
        ) VALUES (
            NEW.laporan_id,
            NEW.mahasiswa_id,
            COALESCE(NEW.status_pelapor, 'Masyarakat Umum'),
            'Status Diubah',
            OLD.status,
            NEW.status,
            NEW.catatan_tindak_lanjut
        );

    -- 2) Jika data lain berubah (bukan status) -> catat 'Laporan Diperbarui'
    ELSEIF (
        NOT (OLD.nama <=> NEW.nama) OR
        NOT (OLD.nomor_telepon <=> NEW.nomor_telepon) OR
        NOT (OLD.domisili <=> NEW.domisili) OR
        NOT (OLD.tanggal <=> NEW.tanggal) OR
        NOT (OLD.jenis_kekerasan <=> NEW.jenis_kekerasan) OR
        NOT (OLD.cerita_peristiwa <=> NEW.cerita_peristiwa) OR
        NOT (OLD.pelampiran_bukti <=> NEW.pelampiran_bukti) OR
        NOT (OLD.disabilitas <=> NEW.disabilitas) OR
        NOT (OLD.status_pelapor <=> NEW.status_pelapor) OR
        NOT (OLD.alasan <=> NEW.alasan) OR
        NOT (OLD.alasan_lainnya <=> NEW.alasan_lainnya) OR
        NOT (OLD.pendampingan <=> NEW.pendampingan) OR
        NOT (OLD.catatan_tindak_lanjut <=> NEW.catatan_tindak_lanjut) OR
        NOT (OLD.mahasiswa_id <=> NEW.mahasiswa_id)
    ) THEN
        INSERT INTO riwayat_laporan (
            laporan_id,
            pelapor_id,
            pelapor_role,
            aksi,
            catatan
        ) VALUES (
            NEW.laporan_id,
            NEW.mahasiswa_id,
            COALESCE(NEW.status_pelapor, 'Masyarakat Umum'),
            'Laporan Diperbarui',
            NEW.catatan_tindak_lanjut
        );
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `mahasiswa`
--

CREATE TABLE `mahasiswa` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `nim` varchar(20) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `jurusan` varchar(100) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `mahasiswa`
--

INSERT INTO `mahasiswa` (`id`, `user_id`, `nim`, `full_name`, `jurusan`, `phone_number`) VALUES
(1, 1, '23759001', 'roy suryo', 'Teknik Informatika', '081234567890'),
(2, 2, '24783102', 'jokowi', 'Teknik Kehutanan', '081234567891');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `type` enum('LAPORAN_BARU','STATUS_LAPORAN','KONTEN_EDUKASI','KONTEN_AKTIVITAS') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `ref_id` int(11) DEFAULT NULL,
  `ref_type` enum('LAPORAN','EDUKASI','AKTIVITAS') DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `type`, `title`, `message`, `ref_id`, `ref_type`, `user_id`, `is_read`, `read_at`, `created_at`) VALUES
(13, 'LAPORAN_BARU', 'Laporan Dalam Diproses', 'Laporan telah diterima dan menunggu verifikasi. Kode: LP-000024KV', 24, 'LAPORAN', NULL, 0, NULL, '2025-12-15 18:36:41'),
(14, 'LAPORAN_BARU', 'Laporan Dalam Diproses', 'Laporan telah diterima dan menunggu verifikasi. Kode: LP-000025KV', 25, 'LAPORAN', NULL, 0, NULL, '2025-12-15 20:21:52');

-- --------------------------------------------------------

--
-- Table structure for table `riwayat_laporan`
--

CREATE TABLE `riwayat_laporan` (
  `id` int(11) NOT NULL,
  `laporan_id` int(11) NOT NULL,
  `pelapor_id` int(11) DEFAULT NULL,
  `pelapor_role` enum('Mahasiswa','Pendidik','Staff/Teknisi','Warga Kampus','Masyarakat Umum') NOT NULL,
  `aksi` enum('Laporan Dibuat','Status Diubah','Laporan Diperbarui') NOT NULL,
  `status_sebelumnya` enum('Dalam Proses','Verifikasi','Proses Lanjutan','Selesai','Ditolak') DEFAULT NULL,
  `status_baru` enum('Dalam Proses','Verifikasi','Proses Lanjutan','Selesai','Ditolak') DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `riwayat_laporan`
--

INSERT INTO `riwayat_laporan` (`id`, `laporan_id`, `pelapor_id`, `pelapor_role`, `aksi`, `status_sebelumnya`, `status_baru`, `catatan`, `created_at`) VALUES
(35, 24, 2, 'Mahasiswa', 'Laporan Dibuat', NULL, 'Dalam Proses', NULL, '2025-12-15 18:36:41'),
(36, 24, 2, 'Mahasiswa', 'Status Diubah', 'Dalam Proses', '', NULL, '2025-12-15 20:14:00'),
(37, 25, 1, 'Pendidik', 'Laporan Dibuat', NULL, 'Dalam Proses', NULL, '2025-12-15 20:21:52'),
(38, 25, 1, 'Pendidik', 'Status Diubah', 'Dalam Proses', 'Ditolak', 'maksa amat ijazah palsu', '2025-12-15 20:44:23');

-- --------------------------------------------------------

--
-- Table structure for table `super_admin`
--

CREATE TABLE `super_admin` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `identity_number` varchar(20) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('super_admin','admin','mahasiswa') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `identity_number`, `username`, `password`, `role`, `is_active`, `created_at`) VALUES
(1, '23759001', 'test1', '$2b$10$4RV3t.btC3I.4o53HMs6r.AqD2iay9cFzsfAXl1BQ3z9NoqTqJ.rC', 'mahasiswa', 1, '2025-12-10 16:49:55'),
(2, '24783102', 'test2', '$2b$10$v3SCbld52AiRIZmfwQ4kUevok09XD9gEoiy1habBBnPlXmh64eQk2', 'mahasiswa', 1, '2025-12-11 17:06:59'),
(3, 'ADM0001', 'admin1', '$2b$10$taSznVgz.UjlNkOP4w0cpuvv/kZqriD7jt8Li2g4ey04XAE7qXFze', 'admin', 1, '2025-12-15 18:38:21'),
(4, 'ADM0002', 'admin2', '$2b$10$vnLMjbeaRKYayDVZ4jV8r.yAFXM66svQRR.DTUawuyd91jvTupKDC', 'admin', 1, '2025-12-15 18:38:21');

-- --------------------------------------------------------

--
-- Table structure for table `user_notifications`
--

CREATE TABLE `user_notifications` (
  `id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `aktivitas`
--
ALTER TABLE `aktivitas`
  ADD PRIMARY KEY (`aktivitas_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `edukasi`
--
ALTER TABLE `edukasi`
  ADD PRIMARY KEY (`edukasi_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `laporan`
--
ALTER TABLE `laporan`
  ADD PRIMARY KEY (`laporan_id`),
  ADD KEY `mahasiswa_id` (`mahasiswa_id`);

--
-- Indexes for table `mahasiswa`
--
ALTER TABLE `mahasiswa`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `nim` (`nim`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_user_unread` (`user_id`,`is_read`,`created_at`);

--
-- Indexes for table `riwayat_laporan`
--
ALTER TABLE `riwayat_laporan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_riwayat_laporan_laporan_id` (`laporan_id`),
  ADD KEY `idx_riwayat_laporan_pelapor_id` (`pelapor_id`);

--
-- Indexes for table `super_admin`
--
ALTER TABLE `super_admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `identity_number` (`identity_number`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notification_id` (`notification_id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `aktivitas`
--
ALTER TABLE `aktivitas`
  MODIFY `aktivitas_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `edukasi`
--
ALTER TABLE `edukasi`
  MODIFY `edukasi_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `laporan`
--
ALTER TABLE `laporan`
  MODIFY `laporan_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `mahasiswa`
--
ALTER TABLE `mahasiswa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `riwayat_laporan`
--
ALTER TABLE `riwayat_laporan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=39;

--
-- AUTO_INCREMENT for table `super_admin`
--
ALTER TABLE `super_admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_notifications`
--
ALTER TABLE `user_notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin`
--
ALTER TABLE `admin`
  ADD CONSTRAINT `admin_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `aktivitas`
--
ALTER TABLE `aktivitas`
  ADD CONSTRAINT `aktivitas_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `edukasi`
--
ALTER TABLE `edukasi`
  ADD CONSTRAINT `edukasi_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `laporan`
--
ALTER TABLE `laporan`
  ADD CONSTRAINT `laporan_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa` (`id`);

--
-- Constraints for table `mahasiswa`
--
ALTER TABLE `mahasiswa`
  ADD CONSTRAINT `mahasiswa_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `riwayat_laporan`
--
ALTER TABLE `riwayat_laporan`
  ADD CONSTRAINT `fk_riwayat_laporan_laporan` FOREIGN KEY (`laporan_id`) REFERENCES `laporan` (`laporan_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `super_admin`
--
ALTER TABLE `super_admin`
  ADD CONSTRAINT `super_admin_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD CONSTRAINT `user_notifications_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_notifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
