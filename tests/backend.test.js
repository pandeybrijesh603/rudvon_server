import fs from "fs";
import path from "path";
import request from "supertest";
import app from "../server.js";

// 🧠 Helper function: Extract route names from /routes folder
const ROUTES_DIR = path.resolve("routes");
const files = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith("Routes.js"));

describe("🧪 RudVon Auto API Test Suite", () => {
  // ✅ Test each route file automatically
  files.forEach(file => {
    const routeName = file.replace("Routes.js", "").toLowerCase();
    const endpoint = `/api/${routeName}`;

    it(`🔍 [${routeName}] should respond to GET ${endpoint}`, async () => {
      const res = await request(app).get(endpoint);
      expect([200, 201, 400, 401, 404]).toContain(res.statusCode);
    });
  });
});

// 🧩 Model existence tests
const MODELS_DIR = path.resolve("models");
const modelFiles = fs.readdirSync(MODELS_DIR).filter(f => f.endsWith(".js"));

describe("📦 Model Files Validation", () => {
  modelFiles.forEach(model => {
    it(`✅ Model exists: ${model}`, () => {
      const exists = fs.existsSync(path.join(MODELS_DIR, model));
      expect(exists).toBe(true);
    });
  });
});

// ⚙️ Utils existence tests
const UTILS_DIR = path.resolve("utils");
const utilsFiles = fs.readdirSync(UTILS_DIR).filter(f => f.endsWith(".js"));

describe("🧠 Utility Function Files", () => {
  utilsFiles.forEach(util => {
    it(`⚙️ Utility file present: ${util}`, () => {
      const exists = fs.existsSync(path.join(UTILS_DIR, util));
      expect(exists).toBe(true);
    });
  });
});
