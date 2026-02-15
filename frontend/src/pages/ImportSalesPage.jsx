import { useState } from "react";
import { Alert, Button, Card, Space, Typography, Upload } from "antd";

const { Dragger } = Upload;

export default function ImportSalesPage({ onImport, importLoading }) {
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState(null);

  const props = {
    multiple: false,
    accept: ".csv,text/csv",
    beforeUpload: async (file) => {
      const text = await file.text();
      setCsvText(text);
      return false;
    },
    showUploadList: true,
  };

  const runImport = async () => {
    const res = await onImport(csvText);
    setResult(res);
  };

  return (
    <div className="page-stack">
      <Card className="page-card" title="Import Transactions (CSV)">
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Typography.Text type="secondary">
            Required headers example: `date,entityId,item,qty,unitAmount,gstRate,dueDate,paidAmount,note`.
            Optional headers: `productId,batchingEnabled,batchNo,mfgDate,expDate`.
          </Typography.Text>

          <Dragger {...props}>
            <p className="ant-upload-text">Drop CSV file here or click to select</p>
            <p className="ant-upload-hint">Bulk import sales records into the ledger</p>
          </Dragger>

          <Button type="primary" onClick={runImport} loading={importLoading} disabled={!csvText.trim() || importLoading}>
            Run Import
          </Button>

          {result ? (
            <Alert
              type={result.errorCount > 0 ? "warning" : "success"}
              message={`Imported: ${result.importedCount}, Errors: ${result.errorCount}`}
              description={
                result.errors?.length
                  ? result.errors.map((e, i) => <div key={i}>Row {e.row}: {e.error}</div>)
                  : "All rows imported successfully."
              }
              showIcon
            />
          ) : null}
        </Space>
      </Card>
    </div>
  );
}
