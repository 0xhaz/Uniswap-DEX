import React, { useEffect, useState, useRef } from "react";

import toast, { Toaster } from "react-hot-toast";
import {
  ClipboardIcon,
  ClipboardCheckIcon,
  PlusIcon,
} from "@heroicons/react/outline";

type TokenBalanceProps = {
  name: string;
  walletAddress: string;
};

const TokenBalance = ({ name, walletAddress }: TokenBalanceProps) => {
  const [balance, setBalance] = useState("-");
  const [tokenAddress, setTokenAddress] = useState<string | null>();
  const [copyIcon, setCopyIcon] = useState({ icon: ClipboardIcon });
  const [txPending, setTxPending] = useState(false);

  const notifyError = (msg: string) => toast.error(msg, { duration: 6000 });
  const notifySuccess = () => toast.success("Transaction completed");

  useEffect(() => {
    if (name && walletAddress) {
      // TODO: get token address from name
    } else setBalance("-");
  }, [name, walletAddress]);

  return (
    <div className="flex mx-2">
      <div className="flex items-center bg-zinc-900 text-zinc-300 w-fit p-2 px-3 rounded-l-lg">
        <p className="text-sm">{name}</p>
        <p className="bg-zinc-800 p-0.5 px-3 ml-3 rounded-lg text-zinc-100">
          {balance}
        </p>
      </div>

      <div className="flex items-center p-2 px-2 bg-[#2172e5] rounded-r-lg">
        <copyIcon.icon
          className="h-6 cursor-pointer"
          onClick={() => {
            navigator.clipboard.writeText(tokenAddress || "");
            setCopyIcon({ icon: ClipboardCheckIcon });
          }}
        />
      </div>

      {/* {txPending && <TransactionStatus />} */}
      <Toaster />
    </div>
  );
};

export default TokenBalance;
