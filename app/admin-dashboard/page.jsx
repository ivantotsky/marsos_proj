"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DollarSign, Users, CreditCard, Activity } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <>
      <h1 className='text-2xl font-bold mb-6'>Dashboard Overview</h1>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>Total Revenue</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>SAR 0</div>
            <p className='text-sm text-muted-foreground'>0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>Active Users</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
            <p className='text-sm text-muted-foreground'>0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>Transactions</CardTitle>
            <CreditCard className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
            <p className='text-sm text-muted-foreground'>0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex justify-between items-center'>
            <CardTitle className='text-sm'>Analytics</CardTitle>
            <Activity className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0%</div>
            <p className='text-sm text-muted-foreground'>Stable</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
