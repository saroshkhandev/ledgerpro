const crypto = require("crypto");

class AuthService {
  constructor(models) {
    this.models = models;
  }

  hash(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  sanitizeCurrency(value) {
    const code = String(value || "INR").trim().toUpperCase();
    return /^[A-Z]{3}$/.test(code) ? code : "INR";
  }

  sanitizeText(value) {
    return String(value || "").trim();
  }

  mapPublicProfile(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address || "",
      photoUrl: user.photoUrl || "",
      currency: this.sanitizeCurrency(user.currency),
      businessName: user.businessName || user.name || "",
      businessGstin: user.businessGstin || "",
      businessPhone: user.businessPhone || "",
      businessEmail: user.businessEmail || user.email || "",
      bankName: user.bankName || "",
      bankBranch: user.bankBranch || "",
      bankAccountNo: user.bankAccountNo || "",
      bankIfsc: user.bankIfsc || "",
    };
  }

  async register({ name, email, password, address, photoUrl }) {
    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanName || !cleanEmail || String(password || "").length < 6) {
      throw new Error("Name, email and password (min 6 chars) are required.");
    }

    const exists = await this.models.users.findByEmail(cleanEmail);
    if (exists) throw new Error("Email already exists.");

    const user = await this.models.users.create({
      name: cleanName,
      email: cleanEmail,
      passwordHash: this.hash(password),
      address: this.sanitizeText(address),
      photoUrl: this.sanitizeText(photoUrl),
      currency: this.sanitizeCurrency("INR"),
      businessName: cleanName,
      businessEmail: cleanEmail,
    });
    return this.mapPublicProfile(user);
  }

  async login({ email, password }) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const user = await this.models.users.findByEmail(cleanEmail);
    if (!user || user.passwordHash !== this.hash(password || "")) {
      throw new Error("Invalid credentials.");
    }
    return this.mapPublicProfile(user);
  }

  async me(userId) {
    if (!userId) return null;
    const user = await this.models.users.findById(userId);
    if (!user) return null;
    return this.mapPublicProfile(user);
  }

  async updateProfile(userId, payload = {}) {
    const patch = {
      name: this.sanitizeText(payload.name),
      address: this.sanitizeText(payload.address),
      photoUrl: this.sanitizeText(payload.photoUrl),
      currency: this.sanitizeCurrency(payload.currency),
      businessName: this.sanitizeText(payload.businessName),
      businessGstin: this.sanitizeText(payload.businessGstin),
      businessPhone: this.sanitizeText(payload.businessPhone),
      businessEmail: this.sanitizeText(payload.businessEmail),
      bankName: this.sanitizeText(payload.bankName),
      bankBranch: this.sanitizeText(payload.bankBranch),
      bankAccountNo: this.sanitizeText(payload.bankAccountNo),
      bankIfsc: this.sanitizeText(payload.bankIfsc),
    };
    if (!patch.name) throw new Error("Name is required.");

    const user = await this.models.users.updateProfile(userId, patch);
    if (!user) throw new Error("User not found.");

    return this.mapPublicProfile(user);
  }
}

module.exports = AuthService;
