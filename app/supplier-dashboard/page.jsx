"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Users, CreditCard, Activity } from "lucide-react";

export default function SupplierDashboardPage() {
  const { t } = useTranslation();

  // Sample stats; replace with real data
  const stats = [
    {
      title: t("dashboard.totalSales"),
      value: 0,
      change: "0%",
      icon: <DollarSign className='h-4 w-4 text-muted-foreground' />,
    },
    {
      title: t("dashboard.rfqsReceived"),
      value: 0,
      change: "0%",
      icon: <Users className='h-4 w-4 text-muted-foreground' />,
    },
    {
      title: t("dashboard.completedOrders"),
      value: 0,
      change: "0%",
      icon: <CreditCard className='h-4 w-4 text-muted-foreground' />,
    },
    {
      title: t("dashboard.responseRate"),
      value: "0%",
      change: "",
      icon: <Activity className='h-4 w-4 text-muted-foreground' />,
    },
  ];

  return (
    <div className='p-4 sm:p-6'>
      <h1 className='text-2xl font-bold mb-6'>{t("dashboard.title")}</h1>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {stats.map((stat, idx) => (
          <Card key={idx} className='flex flex-col justify-between'>
            <CardHeader className='flex justify-between items-center'>
              <CardTitle className='text-sm'>{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stat.value}</div>
              {stat.change && (
                <p className='text-sm text-muted-foreground'>
                  {t("dashboard.changePrefix")} {stat.change}{" "}
                  {t("dashboard.changeSuffix")}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
