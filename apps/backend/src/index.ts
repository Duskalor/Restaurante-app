import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { uploadsDir } from './config/uploads';
import { errorHandler } from './middlewares/error-handler';
import authRoutes from './routes/auth.routes';
import branchesRoutes from './routes/branches.routes';
import businessSettingsRoutes from './routes/business-settings.routes';
import categoriesRoutes from './routes/categories.routes';
import customersRoutes from './routes/customers.routes';
import kitchenRoutes from './routes/kitchen.routes';
import ordersRoutes from './routes/orders.routes';
import paymentsRoutes from './routes/payments.routes';
import productsRoutes from './routes/products.routes';
import rolesRoutes from './routes/roles.routes';
import saasRoutes from './routes/saas.routes';
import tablesRoutes from './routes/tables.routes';
import usersRoutes from './routes/users.routes';
import whatsappRoutes from './whatsapp/whatsapp.routes';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/whatsapp', whatsappRoutes);
app.use('/uploads', express.static(uploadsDir));

app.get('/', (_req, res) => {
  res.json({
    message: 'Backend restaurante funcionando',
    endpoints: {
      login: 'POST /auth/login',
      branches: 'GET /branches',
      createBranch: 'POST /branches',
      roles: 'GET /roles',
      createRole: 'POST /roles',
      users: 'GET /users',
      createUser: 'POST /users',
      categories: 'GET /categories',
      createCategory: 'POST /categories',
      products: 'GET /products',
      createProduct: 'POST /products',
      tables: 'GET /tables',
      createTable: 'POST /tables',
      updateTableStatus: 'PATCH /tables/:id/status',
      orders: 'GET /orders',
      createOrder: 'POST /orders',
      orderDetail: 'GET /orders/:id',
      addOrderItem: 'POST /orders/:id/items',
      payments: 'GET /payments',
      createPayment: 'POST /payments',
      payOrder: 'PATCH /orders/:id/pay',
    },
  });
});

app.use(authRoutes);
app.use(branchesRoutes);
app.use(businessSettingsRoutes);
app.use(rolesRoutes);
app.use(usersRoutes);
app.use(categoriesRoutes);
app.use(productsRoutes);
app.use(kitchenRoutes);
app.use(tablesRoutes);
app.use(ordersRoutes);
app.use(paymentsRoutes);
app.use(customersRoutes);
app.use(saasRoutes);

app.use(errorHandler);

const PORT = env.PORT;

if (typeof require !== 'undefined' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

export default app;
