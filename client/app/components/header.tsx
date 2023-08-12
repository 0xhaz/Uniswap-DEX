"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import NavItems from "./navItems";

const Header = () => {
  return (
    <div className="fixed left-0 top-0 w-full px-8 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <Image src="/uniswap.png" alt="logo" width={40} height={40} />
        <NavItems />
      </div>

      <div className="flex items-center">{"tokenBalComp"}</div>
      <div className="flex">
        <ConnectButton accountStatus={"full"} />
      </div>

      <Toaster />
    </div>
  );
};

export default Header;
