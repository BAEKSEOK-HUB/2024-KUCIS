-- MySQL dump 10.13  Distrib 8.0.17, for Win64 (x86_64)
--
-- Host: localhost    Database: logindb
-- ------------------------------------------------------
-- Server version	8.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `commentsID` int unsigned NOT NULL AUTO_INCREMENT, -- 댓글 고유 ID (자동 증가)
  `postnum` int unsigned NOT NULL, -- 댓글이 속한 게시글의 번호
  `user_id` varchar(30) NOT NULL, -- 댓글 작성자의 사용자 ID
  `parent_id` int unsigned DEFAULT NULL, -- 부모 댓글 ID (대댓글인 경우 연결된 부모 댓글을 참조)
  `comment` varchar(255) NOT NULL, -- 댓글 내용
  `date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 댓글 작성 날짜 및 시간 (기본값: 현재 시간)
  `ref` varchar(45) NOT NULL, -- 댓글 참조 (연결 정보 등 용도로 사용)
  `report` tinyint DEFAULT '0', -- 댓글 필터링 상태 (기본값: 0, 비속어 탐지된 텍스트 : 1)
  PRIMARY KEY (`commentsID`), -- 기본 키 설정 (commentsID)
  KEY `postnum` (`postnum`), -- 게시글 번호(postnum)에 대한 인덱스 생성
  KEY `comments_ibfk_2` (`user_id`), -- 사용자 ID(user_id)에 대한 인덱스 생성
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`postnum`) REFERENCES `posts` (`postnum`) ON DELETE CASCADE, -- posts 테이블의 postnum을 참조하며, 연결된 게시글이 삭제되면 댓글도 삭제됨
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE -- users 테이블의 id를 참조하며, 사용자가 삭제되면 해당 댓글도 삭제됨
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;

/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-17 22:06:07
