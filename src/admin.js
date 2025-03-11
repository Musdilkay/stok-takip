import AdminJS from 'adminjs';
import AdminJSExpress from '@adminjs/express';
import { Database, Resource } from '@adminjs/mongoose';
import mongoose from 'mongoose';
import express from 'express';
import Product from './models/Product.js'; // ✅ Modeli içe aktar

AdminJS.registerAdapter({ Database, Resource });

const adminJs = new AdminJS({
  resources: [Product], // ✅ Yönetilecek model
  rootPath: '/admin', // ✅ Admin panelinin URL'si
});

const adminRouter = AdminJSExpress.buildRouter(adminJs);
export default adminRouter; // ✅ Router'ı dışa aktar
