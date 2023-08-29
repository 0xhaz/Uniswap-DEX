"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

import NavItems from "./navItems";
import TokenBalance from "./tokenBalance";

const Header = () => {
  const [tokenBalComp, setTokenBalComp] = useState(<></>);
  const { address } = useAccount();

  const notifyConnectWallet = () =>
    toast.error("Connect wallet", { duration: 2000 });

  useEffect(() => {
    setTokenBalComp(
      <>
        <TokenBalance name={"USDT"} walletAddress={address} />
      </>
    );

    if (!address) notifyConnectWallet();
  }, [address]);

  return (
    <div className="fixed left-0 top-0 w-full px-8 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <Image src="/uniswap.png" alt="logo" width={40} height={40} />
      </div>

      <div className="flex items-center justify-center lg:ml-24 ">
        <NavItems />
      </div>
      <div className="flex ">
        <ConnectButton accountStatus={"full"} />
      </div>

      <Toaster />
    </div>
  );
};

export default Header;
