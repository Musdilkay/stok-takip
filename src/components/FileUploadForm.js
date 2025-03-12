import React from "react";
import { Box, Button, FormGroup } from "@adminjs/design-system";
import { ApiClient } from "adminjs";

const FileUploadForm = (props) => {
  const handleSubmit = async (event) => {
    event.preventDefault();
    const fileInput = event.target.elements.file;
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
      const response = await ApiClient.fetch("/admin/api/products/bulk-update-stock", {
        method: "POST",
        body: formData,
      });
      alert("Stoklar başarıyla güncellendi!");
    } catch (error) {
      alert("Hata oluştu!");
    }
  };

  return (
    <Box variant="grey">
      <form onSubmit={handleSubmit}>
        <FormGroup>
          <label htmlFor="file">Dosya Seç</label>
          <input type="file" name="file" />
        </FormGroup>
        <Button type="submit">Dosyayı Yükle</Button>
      </form>
    </Box>
  );
};

export default FileUploadForm;
