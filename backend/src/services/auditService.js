class AuditService {
  constructor(models) {
    this.models = models;
  }

  async list(userId, limit = 200) {
    return this.models.audit.listByUser(userId, limit);
  }

  async log(userId, payload = {}) {
    if (!payload.action || !payload.resource) throw new Error("action and resource are required.");
    return this.models.audit.create(userId, payload);
  }
}

module.exports = AuditService;
