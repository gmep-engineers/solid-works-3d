import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  getRoot(@Res() res: Response) {
    // If request accepts HTML, render a welcoming status page with links
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Levitate3D Headless Backend API</title>
  <style>
    body {
      background: #08090d;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: #12141e;
      border: 1px solid #1f2438;
      border-radius: 20px;
      padding: 40px;
      max-width: 550px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0,0,0,0.6);
    }
    .badge {
      display: inline-block;
      background: rgba(0, 240, 255, 0.1);
      color: #00f0ff;
      border: 1px solid rgba(0, 240, 255, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 26px;
      margin: 0 0 10px 0;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #00f0ff 0%, #0077ff 100%);
      color: #000;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 12px 24px;
      border-radius: 12px;
      margin: 6px;
      transition: transform 0.2s;
    }
    .btn:hover {
      transform: translateY(-2px);
    }
    .btn-secondary {
      background: #1f2538;
      color: #fff;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">BACKEND REST API (PORT 4000) ONLINE</div>
    <h1>Levitate3D Server Active</h1>
    <p>You have accessed the backend API root. If you are looking for the customer studio and 3D viewer storefront, head over to port 3000:</p>
    <a href="http://localhost:3000" class="btn">Open Web Storefront (Port 3000)</a>
    <a href="/api/v1/docs" class="btn btn-secondary">Open Swagger API Docs</a>
  </div>
</body>
</html>
    `;
    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  }
}
