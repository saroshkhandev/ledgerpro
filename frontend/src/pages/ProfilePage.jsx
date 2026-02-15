import { Avatar, Button, Card, Col, Divider, Form, Input, Row, Select, Space, Typography } from "antd";

const currencies = [
  { label: "INR - Indian Rupee", value: "INR" },
  { label: "USD - US Dollar", value: "USD" },
  { label: "EUR - Euro", value: "EUR" },
  { label: "GBP - British Pound", value: "GBP" },
  { label: "AED - UAE Dirham", value: "AED" },
  { label: "SAR - Saudi Riyal", value: "SAR" },
];

export default function ProfilePage({ profileForm, setProfileForm, saveProfile, saveLoading }) {
  return (
    <div className="page-stack">
      <Card className="page-card" title="Profile Settings">
        <Form layout="vertical" className="drawer-form">
        <Space>
          <Avatar size={72} src={profileForm.photoUrl || undefined}>
            {(profileForm.name || "U")[0]}
          </Avatar>
          <Typography.Text type="secondary">Update your business/contact details for invoices and account display.</Typography.Text>
        </Space>

        <Divider className="form-section-divider" />

        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item label="Account Name">
              <Input placeholder="Name" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Account Email">
              <Input placeholder="Email" value={profileForm.email} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item label="Business Name" extra="Shown on invoice headers.">
              <Input
                placeholder="e.g. Aone Computer Pvt Ltd."
                value={profileForm.businessName || ""}
                onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Business GSTIN" extra="Used in GST tax invoices.">
              <Input
                placeholder="e.g. 22ABCDE1234F1Z5"
                value={profileForm.businessGstin || ""}
                onChange={(e) => setProfileForm({ ...profileForm, businessGstin: e.target.value })}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item label="Business Phone">
              <Input
                placeholder="e.g. +91 98xxxxxx10"
                value={profileForm.businessPhone || ""}
                onChange={(e) => setProfileForm({ ...profileForm, businessPhone: e.target.value })}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Business Email">
              <Input
                placeholder="e.g. billing@company.com"
                value={profileForm.businessEmail || ""}
                onChange={(e) => setProfileForm({ ...profileForm, businessEmail: e.target.value })}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Business Address">
          <Input.TextArea rows={3} placeholder="Address" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
        </Form.Item>

        <Divider className="form-section-divider" />

        <Typography.Title level={5} style={{ marginTop: 0 }}>Bank Details</Typography.Title>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item label="Bank Name">
              <Input value={profileForm.bankName || ""} onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Branch Name">
              <Input value={profileForm.bankBranch || ""} onChange={(e) => setProfileForm({ ...profileForm, bankBranch: e.target.value })} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item label="Bank Account No">
              <Input value={profileForm.bankAccountNo || ""} onChange={(e) => setProfileForm({ ...profileForm, bankAccountNo: e.target.value })} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Bank IFSC">
              <Input value={profileForm.bankIfsc || ""} onChange={(e) => setProfileForm({ ...profileForm, bankIfsc: e.target.value })} />
            </Form.Item>
          </Col>
        </Row>

        <Divider className="form-section-divider" />

        <Row gutter={12}>
          <Col xs={24} md={16}>
            <Form.Item label="Photo URL">
              <Input placeholder="Photo URL" value={profileForm.photoUrl} onChange={(e) => setProfileForm({ ...profileForm, photoUrl: e.target.value })} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Currency">
              <Select
                value={profileForm.currency || "INR"}
                onChange={(value) => setProfileForm({ ...profileForm, currency: value })}
                options={currencies}
              />
            </Form.Item>
          </Col>
        </Row>

        <Button type="primary" loading={saveLoading} onClick={saveProfile}>Update Profile</Button>
        </Form>
      </Card>
    </div>
  );
}
