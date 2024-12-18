"use strict";
// 모듈
const express = require("express");
const app = express(); // Express 애플리케이션 초기화
const path = require("path"); // 파일 경로를 다루는 모듈
const bodyParser = require("body-parser"); // HTTP 요청 데이터를 파싱하는 미들웨어
const dotenv = require("dotenv"); // 환경 변수 관리
const morgan = require("morgan"); // HTTP 요청 로깅
const fs = require("fs"); // 파일 시스템 모듈
const cookieParser = require("cookie-parser"); // 쿠키 처리 미들웨어

dotenv.config(); // .env 파일에서 환경 변수를 로드

// 라우팅
const home = require("./src/routes/home"); // 홈 라우터 연결
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, `/log/access.log`), // 로그 파일 경로 설정
  { flags: "a" } // 기존 로그에 추가되도록 설정
);

const logger = require("./src/config/logger");
logger.info(); // 초기 로깅 설정

// 앱 세팅
app.set("views", path.join(__dirname, "src", "views")); // 뷰 파일 경로 설정
app.set("view engine", "ejs"); // EJS를 템플릿 엔진으로 사용
app.use(express.static(path.join(__dirname, "src", "public"))); // 정적 파일 제공 경로 설정
app.use(bodyParser.json()); // JSON 요청 데이터 파싱
app.use(bodyParser.urlencoded({ extended: true })); // URL-encoded 데이터 파싱
app.use(cookieParser()); // 쿠키 파싱 미들웨어 설정

app.use(morgan(":method", { stream: accessLogStream }, "dev")); // HTTP 요청 로깅 설정
app.use("/", home); // 홈 라우터 연결

// ------------------------ 쿠키 ----------------------- //
app.use(express.json()); // JSON 형식의 요청 데이터를 파싱
app.use(express.urlencoded({ extended: true })); // URL-encoded 형식의 요청 데이터를 파싱

// 기본 경로에서 쿠키 확인
app.get("/", (req, res) => {
  const { id } = req.cookies; // 요청 쿠키에서 'id' 추출
  if (id) {
    res.render("login", { id }); // 쿠키가 있으면 로그인 화면 렌더링
    return;
  }

  res.render("index"); // 쿠키가 없으면 메인 화면 렌더링
});

// POST 요청 시 쿠키 설정
app.post("/", (req, res) => {
  const { name } = req.body; // 요청 본문에서 'name' 추출
  res.cookie("userid", name).redirect("/"); // 'userid' 쿠키를 설정하고 리다이렉트
});

// 쿠키 삭제
app.get("/delete", (req, res) => {
  res.clearCookie("userid").redirect("/"); // 'userid' 쿠키 삭제 후 리다이렉트
});

module.exports = app; // 애플리케이션 모듈 내보내기
