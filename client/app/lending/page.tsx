"use client";
import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Button, Input, Modal, Text } from "@nextui-org/react";
import { useAccount, useProvider } from "wagmi";
import { DEFAULT_VALUE, tokens, TokenProps } from "../constants/constants";
import Selector from "../components/selector";
import TransactionStatus from "../components/transactionStatus";
import { contract, tokenContract } from "@/utils/contracts";
import {
  getLendingPoolAddress,
  createPool,
  getRepaidAmount,
  getWithdrawalAmount,
  depositTokens,
  withdrawTokensLending,
  borrowTokens,
  repayTokens,
  depositEther,
  withdrawEtherLending,
  borrowEther,
  repayEther,
  getBalance,
  getEthBalance,
  getLendAmount,
  getBorrowAmount,
  approveTokens,
  hasValidAllowanceLending,
  getTotalBorrowAvailable,
} from "@/utils/queries";
import { formatEth } from "@/utils/ether-utils";

const lendingRouter = contract("lendingPoolRouter");

const Lending = () => {
  const [expandSupply, setExpandSupply] = useState<boolean>(false);
  const [expandBorrow, setExpandBorrow] = useState<boolean>(false);
  const [expandWithdraw, setExpandWithdraw] = useState<boolean>(false);
  const [expandRepay, setExpandRepay] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<TokenProps | null>(
    () => tokens.find(token => token.key === DEFAULT_VALUE) || null
  );
  const [toggleSupply, setToggleSupply] = useState<boolean>(false);
  const [toggleBorrow, setToggleBorrow] = useState<boolean>(false);
  const [toggleWithdraw, setToggleWithdraw] = useState<boolean>(false);
  const [toggleRepay, setToggleRepay] = useState<boolean>(false);
  const [txPending, setTxPending] = useState<boolean>(false);
  const [userBalance, setUserBalance] = useState<number | string>(0);
  const [lendAmount, setLendAmount] = useState<number | string>(0);
  const [borrowedAmount, setBorrowedAmount] = useState<number | string>(0);
  const [repayAmount, setRepayAmount] = useState<number | string>(0);
  const [borrowAmount, setBorrowAmount] = useState<number | string>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [supplyAmount, setSupplyAmount] = useState<number>(0);
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [toBorrow, setToBorrow] = useState<number | string>(0);

  const handleSupplyModal = () => setExpandSupply(true);
  const handleBorrowModal = () => setExpandBorrow(true);
  const handleWithdrawModal = () => setExpandWithdraw(true);
  const handleRepayModal = async () => {
    try {
      const amount = await getRepaidAmount(selectedToken?.key || "");
      setRepayAmount(amount);

      setExpandRepay(true);
    } catch (error) {
      console.log("Fetching repay amount: ", error);
    }
  };

  const isTokenSelected = () =>
    selectedToken !== null && selectedToken.key !== DEFAULT_VALUE;

  const notifyError = (msg: string) => toast.error(msg, { duration: 6000 });
  const notifySuccess = () => toast.success("Transaction completed.");

  const getUserBalance = async () => {
    if (!address) return;
    try {
      if (selectedToken?.key === "ETH") {
        const balance = await getEthBalance(address);
        setUserBalance(balance?.toString() || "0");
      } else {
        const balance = await getBalance(selectedToken?.key || "", address);
        setUserBalance(balance?.toString() || "0");
      }
    } catch (error) {
      console.log("Fetching user balance: ", error);
    }
  };

  const getPoolAddress = async () => {
    try {
      const address = await getLendingPoolAddress(selectedToken?.key || "");
      setPoolAddress(address);
    } catch (error) {
      console.log(error);
    }
  };

  const getPoolBalance = async () => {
    if (!address) return;
    try {
      const tokenInfo = await getTotalBorrowAvailable(selectedToken?.key || "");
      const formatBalance = formatEth(tokenInfo.toString());

      setToBorrow(formatBalance);
    } catch (error) {
      console.log("Fetching pool balance: ", error);
    }
  };

  const fetchLendAmount = async () => {
    try {
      const amount = await getLendAmount(selectedToken?.key || "");
      const formatAmount = formatEth(amount);

      setLendAmount(formatAmount);
    } catch (error) {
      console.log("Fetching lend amount: ", error);
    }
  };

  const fetchBorrowAmount = async () => {
    try {
      const amount = await getBorrowAmount(selectedToken?.key || "");
      const formatAmount = formatEth(amount);
      setBorrowedAmount(formatAmount);
    } catch (error) {
      console.log("Fetching borrow amount: ", error);
    }
  };

  const handleSupply = async () => {
    if (!address || !selectedToken) return;

    if (!lendingRouter) {
      console.log("Lending Router not found");
      return;
    }
    try {
      setTxPending(true);
      if (selectedToken?.key === "ETH") {
        depositEther(supplyAmount.toString());
        notifySuccess();
      } else {
        const hasAllowance = await hasValidAllowanceLending(
          address,
          selectedToken?.key || "",
          supplyAmount.toString()
        );

        if (!hasAllowance) {
          await approveTokens(
            selectedToken?.address || "",
            selectedToken?.abi || [],
            lendingRouter.address,
            supplyAmount.toString()
          );

          notifySuccess();
        }

        depositTokens(selectedToken?.key || "", supplyAmount.toString());
        notifySuccess();
      }
    } catch (error) {
      notifyError("Error supplying");
      console.log("Supplying Error: ", error);
    } finally {
      setTxPending(false);
      setExpandSupply(false);
    }
  };

  const handleBorrow = async () => {
    try {
      setTxPending(true);
      if (selectedToken) {
        if (selectedToken?.key === "ETH") {
          borrowEther(borrowAmount.toString());
          notifySuccess();
        } else {
          borrowTokens(selectedToken?.key || "", borrowAmount.toString());
          notifySuccess();
        }
      }
    } catch (error) {
      notifyError("Error borrowing");
      console.log("Borrowing Error: ", error);
    } finally {
      setTxPending(false);
      setExpandBorrow(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setTxPending(true);
      if (selectedToken) {
        if (selectedToken?.key === "ETH") {
          withdrawEtherLending(withdrawAmount.toString());
          notifySuccess();
        } else {
          withdrawTokensLending(
            selectedToken?.key || "",
            withdrawAmount.toString()
          );
          notifySuccess();
        }
      }
    } catch (error) {
      notifyError("Error withdrawing");
      console.log("Withdrawing Error: ", error);
    } finally {
      setTxPending(false);
      setExpandWithdraw(false);
    }
  };

  const handleRepay = async () => {
    if (!address || !selectedToken) return;

    if (!lendingRouter) {
      console.log("Lending Router not found");
      return;
    }

    try {
      setTxPending(true);
      if (selectedToken) {
        if (selectedToken?.key === "ETH") {
          repayEther(repayAmount.toString());
          notifySuccess();
        } else {
          const hasAllowance = await hasValidAllowanceLending(
            address,
            selectedToken?.key || "",
            repayAmount.toString()
          );

          if (!hasAllowance) {
            await approveTokens(
              selectedToken?.address || "",
              selectedToken?.abi || [],
              lendingRouter.address,
              repayAmount.toString()
            );

            notifySuccess();
          }

          repayTokens(selectedToken?.key || "", repayAmount.toString());
          notifySuccess();
        }
      }
    } catch (error) {
      notifyError("Error repaying");
      console.log("Repaying Error: ", error);
    } finally {
      setTxPending(false);
      setExpandRepay(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!address) return;
    getUserBalance();
    getPoolAddress();
    getPoolBalance();
    fetchLendAmount();
    fetchBorrowAmount();
  }, [selectedToken]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isWalletConnected = localStorage.getItem("walletConnected");
      if (!isWalletConnected) {
        notifyError("Connect Wallet");
      }
    }
  }, []);

  const { address } = useAccount();
  return (
    <>
      <h1 className="text-gray-100 text-3xl font-semibold">Lending Pool</h1>
      <div className="w-[60%]  bg-[#212429] mt-10 flex flex-col justify-center items-center px-4 py-10">
        <div className="w-full flex flex-col justify-around"></div>
        <div className="flex items-center justify-between">
          <div className="text-gray-100 flex m-10 text-lg font-semibold">
            Lend
          </div>
          <Selector
            id={"lend"}
            setToken={(token: TokenProps) => setSelectedToken(token)}
            defaultValue={selectedToken || null}
            ignoreValue={"ETH"}
            tokens={tokens}
          />
        </div>

        <div className="flex  justify-between w-full">
          <div className="mt-4 relative border w-full mr-4 text-white border-gray-500 py-4 px-6 rounded-md flex flex-col items-center justify-between">
            <div className="flex items-center justify-between w-full my-2">
              <div>Wallet Balance</div>
              <div>{userBalance}</div>
            </div>
            <div className="flex items-center justify-between w-full my-2">
              <div>Available to supply</div>
              <div>{userBalance}</div>
            </div>
            <div className="flex items-center justify-between w-full my-2">
              <div>Available to borrow</div>
              <div>{toBorrow}</div>
            </div>
          </div>
          <div className="mt-4 relative border w-full ml-2 text-white border-gray-500 py-4 px-6 rounded-md flex flex-col items-center justify-between">
            <div className="flex items-center justify-between w-full my-2">
              <div>Supplied Amount</div>
              <div>{lendAmount}</div>
            </div>
            <div className="flex items-center justify-between w-full my-2">
              <div>Borrowed Amount</div>
              <div>{borrowedAmount}</div>
            </div>
            <div className="flex items-center justify-between w-full my-2">
              <div>Interest</div>
              <div>13 %</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between m-2 gap-4 items-center">
          <Button
            auto
            className="mt-4"
            onClick={() => {
              setToggleSupply(!toggleSupply);
              setToggleBorrow(false);
            }}
            onPress={handleSupplyModal}
            disabled={!isTokenSelected()}
          >
            Supply
          </Button>
          {isTokenSelected() && (
            <Modal
              closeButton
              blur
              aria-labelledby="modal-title"
              open={expandSupply}
              onClose={() => setExpandSupply(false)}
              width="600px"
              css={{
                backgroundColor: "#212429",
              }}
            >
              <Modal.Header>
                <Text
                  size={20}
                  css={{
                    color: "#fff",
                  }}
                >
                  Deposit Amounts
                </Text>
              </Modal.Header>
              <Modal.Body>
                <div className="bg-[#212429] p-4 py-2 rounded-xl mb-2 border-[2px] border-transparent hover:border-zinc-600">
                  <div className="flex items-center rounded-xl">
                    <input
                      className="relative text-white w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36]"
                      type="number"
                      placeholder="0.0"
                      onChange={e => setSupplyAmount(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex justify-center py-3">
                  <button
                    id="supply"
                    className="p-4 m-4 my-2 w-[50%] rounded-xl bg-blue-700 text-white hover:bg-blue-600"
                    onClick={() => handleSupply()}
                  >
                    Add Supply
                  </button>
                </div>
              </Modal.Body>
            </Modal>
          )}

          <Button
            auto
            className="mt-4"
            onClick={() => {
              setToggleBorrow(!toggleBorrow);
              setToggleSupply(false);
            }}
            onPress={handleBorrowModal}
            disabled={!isTokenSelected()}
          >
            Borrow
          </Button>
          {isTokenSelected() && (
            <Modal
              closeButton
              blur
              aria-labelledby="modal-title"
              open={expandBorrow}
              onClose={() => setExpandBorrow(false)}
              width="600px"
              css={{
                backgroundColor: "#212429",
              }}
            >
              <Modal.Header>
                <Text
                  size={20}
                  css={{
                    color: "#fff",
                  }}
                >
                  Borrow Amounts
                </Text>
              </Modal.Header>
              <Modal.Body>
                <div className="bg-[#212429] p-4 py-2 rounded-xl mb-2 border-[2px] border-transparent hover:border-zinc-600">
                  <div className="flex items-center rounded-xl">
                    <input
                      className="relative text-white w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36]"
                      type="number"
                      placeholder="0.0"
                      onChange={e => setBorrowAmount(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex justify-center py-3">
                  <button
                    id="borrow"
                    className="p-4 m-4 my-2 w-[50%] rounded-xl bg-blue-700 text-white hover:bg-blue-600"
                    onClick={() => handleBorrow()}
                  >
                    Borrow
                  </button>
                </div>
              </Modal.Body>
            </Modal>
          )}

          <Button
            auto
            className="mt-4"
            onClick={() => {
              setToggleWithdraw(!toggleWithdraw);
              setToggleRepay(false);
              setToggleBorrow(false);
              setToggleSupply(false);
            }}
            onPress={handleWithdrawModal}
            id="withdraw"
            disabled={!isTokenSelected()}
          >
            Withdraw
          </Button>

          {isTokenSelected() && (
            <Modal
              closeButton
              blur
              aria-labelledby="modal-title"
              open={expandWithdraw}
              onClose={() => setExpandWithdraw(false)}
              width="600px"
              css={{
                backgroundColor: "#212429",
              }}
            >
              <Modal.Header>
                <Text
                  size={20}
                  css={{
                    color: "#fff",
                  }}
                >
                  Withdraw Amounts
                </Text>
              </Modal.Header>
              <Modal.Body>
                <div className="bg-[#212429] p-4 py-2 rounded-xl mb-2 border-[2px] border-transparent hover:border-zinc-600">
                  <div className="flex items-center rounded-xl">
                    <input
                      className="relative text-white w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36]"
                      type="number"
                      placeholder="0.0"
                      onChange={e => setWithdrawAmount(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex justify-center py-3">
                  <button
                    id="withdraw"
                    className="p-4 m-4 my-2 w-[50%] rounded-xl bg-blue-700 text-white hover:bg-blue-600"
                    onClick={() => handleWithdraw()}
                  >
                    Withdraw
                  </button>
                </div>
              </Modal.Body>
            </Modal>
          )}
          <Button
            auto
            className="mt-4"
            onClick={() => {
              setToggleRepay(!toggleRepay);
              setToggleWithdraw(false);
              setToggleBorrow(false);
              setToggleSupply(false);
            }}
            onPress={handleRepayModal}
            disabled={!isTokenSelected()}
          >
            Repay
          </Button>

          {isTokenSelected() && (
            <Modal
              closeButton
              blur
              aria-labelledby="modal-title"
              open={expandRepay}
              onClose={() => setExpandRepay(false)}
              width="600px"
              css={{
                backgroundColor: "#212429",
              }}
            >
              <Modal.Header>
                <Text
                  size={20}
                  css={{
                    color: "#fff",
                  }}
                >
                  Repay Amounts
                </Text>
              </Modal.Header>
              <Modal.Body>
                <div className="bg-[#212429] p-4 py-2 rounded-xl mb-2 border-[2px] border-transparent hover:border-zinc-600">
                  <div className="flex items-center rounded-xl">
                    <input
                      className="relative text-white w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36]"
                      type="number"
                      placeholder="0.0"
                      value={repayAmount}
                      onChange={e => setRepayAmount(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex justify-center py-3">
                  <button
                    id="repay"
                    className="p-4 m-4 my-2 w-[50%] rounded-xl bg-blue-700 text-white hover:bg-blue-600"
                    onClick={() => handleRepay()}
                  >
                    Repay
                  </button>
                </div>
              </Modal.Body>
            </Modal>
          )}

          {txPending && <TransactionStatus />}

          <Toaster />
        </div>
      </div>
    </>
  );
};

export default Lending;
