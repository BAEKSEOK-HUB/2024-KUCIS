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
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `messageid` int unsigned NOT NULL AUTO_INCREMENT, -- 메시지 고유 ID (자동 증가)
  `roomid` int unsigned NOT NULL, -- 메시지가 속한 방의 ID (message_list 테이블 참조)
  `sender_id` varchar(30) NOT NULL, -- 메시지를 보낸 사용자 ID
  `reciver_id` varchar(30) NOT NULL, -- 메시지를 받은 사용자 ID
  `content` text NOT NULL, -- 메시지 내용
  `send_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, -- 메시지 전송 시간 (기본값: 현재 시간)
  `report` tinyint DEFAULT '0', -- 메시지 필터링 여부 (0: 일반 텍스트, 1: 비속어 탐지된 텍스트)
  PRIMARY KEY (`messageid`), -- 기본 키 설정 (messageid)
  KEY `roomid` (`roomid`), -- 방 ID(roomid)에 대한 인덱스 생성
  KEY `sender_id` (`sender_id`), -- 메시지 보낸 사용자 ID(sender_id)에 대한 인덱스 생성
  KEY `message_ibfk_3` (`reciver_id`), -- 메시지 받은 사용자 ID(reciver_id)에 대한 인덱스 생성
  CONSTRAINT `message_ibfk_1` FOREIGN KEY (`roomid`) REFERENCES `message_list` (`roomid`) ON DELETE CASCADE, -- message_list 테이블의 roomid를 참조하며, 관련 메시지 방이 삭제되면 메시지도 삭제됨
  CONSTRAINT `message_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE, -- users 테이블의 id를 참조하며, 보낸 사용자가 삭제되면 해당 메시지도 삭제됨
  CONSTRAINT `message_ibfk_3` FOREIGN KEY (`reciver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE -- users 테이블의 id를 참조하며, 받은 사용자가 삭제되면 해당 메시지도 삭제됨
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--

LOCK TABLES `message` WRITE;
/*!40000 ALTER TABLE `message` DISABLE KEYS */;

/*!40000 ALTER TABLE `message` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-17 22:06:06
