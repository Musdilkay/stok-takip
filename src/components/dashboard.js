import React from "react";
import { Box, H1, H2, Table, TableRow, TableCell, TableHead, TableBody } from "@adminjs/design-system";

const Dashboard = (props) => {
  const { message, stats, latestOrders } = props;

  return (
    <Box variant="container">
      <H1>{message}</H1>

      <Box display="flex" flexWrap="wrap" justifyContent="space-between">
        {stats.map((stat, index) => (
          <Box key={index} variant="card" width="30%" p="20px" textAlign="center">
            <H2>{stat.label}</H2>
            <p style={{ fontSize: "24px", fontWeight: "bold" }}>{stat.value}</p>
          </Box>
        ))}
      </Box>

      <Box mt="40px">
        <H2>Son 5 Sipariş</H2>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Müşteri</TableCell>
              <TableCell>Toplam</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Tarih</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {latestOrders.map((order, index) => (
              <TableRow key={index}>
                <TableCell>{order.müşteri}</TableCell>
                <TableCell>{order.toplam}</TableCell>
                <TableCell>{order.durum}</TableCell>
                <TableCell>{order.tarih}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default Dashboard;
