"use client"

import { PricingTable } from "@clerk/nextjs";

export default function Pricing(){
    return(
        <div className="h-screen w-full flex flex-col items-center justify-center ">
            <PricingTable />
        </div>
        
    );
}