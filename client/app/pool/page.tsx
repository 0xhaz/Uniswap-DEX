"use client";
import { Fragment, useState, useEffect } from "react";
import Image from "next/image";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import {
  Button,
  Input,
  Modal,
  Text,
  useModal,
  Dropdown,
} from "@nextui-org/react";
import { contract, tokenContract } from "@/utils/contracts";
import {
  getBalance,
  getEthBalance,
  addLiquidity,
  addLiquidityETH,
  removeLiquidity,
  removeLiquidityETH,
  getLiquidity,
  approveTokens,
  getPairAddress,
} from "@/utils/queries";
import {
  CONTRACTS,
  tokens,
  TokenProps,
  tokenPairs,
} from "../constants/constants";
import Selector from "../components/selector";
import TransactionStatus from "../components/transactionStatus";
import { formatEth, toEth, toWei } from "@/utils/ether-utils";
import toast, { Toaster } from "react-hot-toast";

const swapRouter = contract("swapRouter");

const Pool = () => {
  const [expand, setExpand] = useState<boolean>(false);
  const [selectedToken1, setSelectedToken1] = useState<TokenProps | null>(
    tokens[0]
  );
  const [selectedToken2, setSelectedToken2] = useState<TokenProps | null>(
    tokens[1]
  );
  const [txPending, setTxPending] = useState<boolean>(false);
  const [desiredAmountA, setDesiredAmountA] = useState<number | string>(0);
  const [desiredAmountB, setDesiredAmountB] = useState<number | string>(0);
  const [liquidity, setLiquidity] = useState<string>("0");
  const [positions, setPositions] = useState<any[]>([]);
  const [reserveA, setReserveA] = useState<number | string>(0);
  const [reserveB, setReserveB] = useState<number | string>(0);
  const [balanceToken1, setBalanceToken1] = useState<number | null>(null);
  const [balanceToken2, setBalanceToken2] = useState<number | null>(null);
  const [ethBalance, setEthBalance] = useState<number | null>(null);
  const [showRemoveInput, setShowRemoveInput] = useState<boolean[]>([]);
  const [selectedToken1Options, setSelectedToken1Options] = useState(tokens);
  const [selectedToken2Options, setSelectedToken2Options] = useState(tokens);

  const { address } = useAccount();

  const renderTable = address !== undefined;

  const tokenAddressToName = {
    [CONTRACTS.USDT.address]: "USDT",
    [CONTRACTS.USDC.address]: "USDC",
    [CONTRACTS.LINK.address]: "LINK",
    [CONTRACTS.WETH.address]: "WETH",
  };

  const tokenNameToAddress: { [key: string]: string } = {
    USDT: CONTRACTS.USDT.address,
    USDC: CONTRACTS.USDC.address,
    LINK: CONTRACTS.LINK.address,
    WETH: CONTRACTS.WETH.address,
  };

  const notifyError = (msg: string) => toast.error(msg, { duration: 6000 });
  const notifySuccess = () => toast.success("Transaction completed.");

  const getPositions = async (address: string) => {
    if (!address) return;

    const positions = [];
    const processedPairs = new Set();

    for (let i = 0; i < tokenPairs.length; i++) {
      const [tokenA, tokenB] = tokenPairs[i];

      try {
        const pairIdentifier1 = `${tokenA}-${tokenB}`;
        const pairIdentifier2 = `${tokenB}-${tokenA}`;

        if (
          !processedPairs.has(pairIdentifier1) &&
          !processedPairs.has(pairIdentifier2)
        ) {
          const pairAddress = await getPairAddress(tokenA, tokenB);

          if (pairAddress) {
            const liquidityAtoB = await getLiquidity(
              pairAddress,
              address,
              tokenA,
              tokenB
            );

            if (!liquidityAtoB) return;

            if (parseFloat(liquidityAtoB) > 0) {
              positions.push({
                tokenA: tokenAddressToName[tokenA] || tokenA,
                tokenB: tokenAddressToName[tokenB] || tokenB,
                liquidity: parseFloat(liquidityAtoB).toFixed(2),
                pairAddress: pairAddress,
              });

              processedPairs.add(pairIdentifier1);
              processedPairs.add(pairIdentifier2);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    setPositions(positions);
  };

  const positionsWithLiquidity = positions
    .filter(position => parseFloat(position.liquidity) > 0)
    .map(position => {
      const tokenAName = tokenAddressToName[position.tokenA] || position.tokenA;
      const tokenBName = tokenAddressToName[position.tokenB] || position.tokenB;

      return {
        ...position,
        tokenA: tokenAName,
        tokenB: tokenBName,
      };
    });

  const handleModal = () => setExpand(true);
  const closeModal = () => setExpand(false);

  // get reserves for a pair of tokens when user select both tokens
  const getReserves = async (tokenA: string, tokenB: string) => {
    const swapRouter = contract("swapRouter");
    try {
      const response = await swapRouter?.getReserve(tokenA, tokenB);

      // return {
      //   reserveA: response?.reserveA,
      //   reserveB: response?.reserveB,
      // };
      setReserveA(formatEth(response?.reserveA));
      setReserveB(formatEth(response?.reserveB));
    } catch (error) {
      console.error(error);
      return {
        reserveA: 0,
        reserveB: 0,
      };
    }
  };

  // const fetchReserves = async () => {
  //   if (selectedToken1 && selectedToken2 && selectedToken1 != selectedToken2) {
  //     const token1Address = selectedToken1.address || "";
  //     const token2Address = selectedToken2.address || "";

  //     const reserves = await getReserves(token1Address, token2Address);
  //     setReserveA(formatEth(reserves.reserveA));
  //     setReserveB(formatEth(reserves.reserveB));
  //     console.log("Reserves A: ", reserves.reserveA);
  //     console.log("Reserves B: ", reserves.reserveB);
  //   }
  // };

  // quote amountA for amountB
  const quoteA = async (
    amountB: string,
    reserveA: string,
    reserveB: string
  ) => {
    const swapRouter = contract("swapRouter");
    try {
      if (amountB) {
        const fetchQuote = await swapRouter?.quote(
          toEth(amountB.toString()),
          toEth(reserveA.toString()),
          toEth(reserveB.toString())
        );
        setDesiredAmountA(toEth(fetchQuote));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // quote amountB for amountA
  const quoteB = async (
    amountA: string,
    reserveA: string,
    reserveB: string
  ) => {
    const swapRouter = contract("swapRouter");
    try {
      if (amountA) {
        const fetchQuote = await swapRouter?.quote(
          toEth(amountA.toString()),
          toEth(reserveB.toString()),
          toEth(reserveA.toString())
        );
        setDesiredAmountB(toEth(fetchQuote));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddLiquidity = async () => {
    try {
      if (selectedToken1 === selectedToken2) {
        alert("Please select different tokens");
        return;
      }

      if (!swapRouter) {
        console.error("Swap router not found");
        return;
      }

      const token1Address = selectedToken1?.address || "";
      const token2Address = selectedToken2?.address || "";

      const selectedPair = [token1Address, token2Address];

      const validPairIndex = tokenPairs.findIndex(pair => {
        return pair[0] === selectedPair[0] && pair[1] === selectedPair[1];
      });

      if (validPairIndex !== -1) {
        setTxPending(true);
        if (selectedToken1?.key !== "ETH" && selectedToken2?.key !== "ETH") {
          await approveTokens(
            token1Address,
            selectedToken1?.abi,
            swapRouter.address,
            desiredAmountA.toString()
          );

          await approveTokens(
            token2Address,
            selectedToken2?.abi,
            swapRouter.address,
            desiredAmountB.toString()
          );
          notifySuccess();

          await addLiquidity(
            token1Address,
            token2Address,
            desiredAmountA.toString(),
            desiredAmountB.toString()
          );
          notifySuccess();

          // await fetchReserves();
        } else if (selectedToken1?.key === "ETH") {
          await approveTokens(
            token2Address,
            selectedToken2?.abi,
            swapRouter.address,
            desiredAmountB.toString()
          );
          notifySuccess();

          await addLiquidityETH(
            token2Address,
            desiredAmountB.toString(),
            desiredAmountA.toString()
          );
          notifySuccess();

          // await fetchReserves();
        } else if (selectedToken2?.key === "ETH") {
          await approveTokens(
            token1Address,
            selectedToken1?.abi,
            swapRouter.address,
            desiredAmountA.toString()
          );
          notifySuccess();

          await addLiquidityETH(
            token1Address,
            desiredAmountA.toString(),
            desiredAmountB.toString()
          );
          notifySuccess();

          // await fetchReserves();
        }
      } else {
        notifyError("Please select a valid token pair");
      }
    } catch (error) {
      console.error("Error adding liquidity: ", error);
      notifyError("Error adding liquidity");
      setTxPending(false);
    } finally {
      setTxPending(false);
      closeModal();
    }
  };

  const handleRemoveLiquidity = async (
    inputToken1Name: string,
    inputToken2Name: string,
    pairLiquidity: string,
    rowIndex: number
  ) => {
    const inputToken1Address = tokenNameToAddress[inputToken1Name];
    const inputToken2Address = tokenNameToAddress[inputToken2Name];

    try {
      if (inputToken1Address === inputToken2Address) {
        alert("Please select different tokens");
        return;
      }

      if (!address) return;

      if (!swapRouter) {
        console.error("Swap router not found");
        return;
      }

      if (
        inputToken1Address &&
        inputToken2Address &&
        inputToken1Address != inputToken2Address &&
        liquidity
      ) {
        const isPairValid = tokenPairs.some(
          ([tokenA, tokenB]) =>
            (tokenA === inputToken1Address && tokenB === inputToken2Address) ||
            (tokenB === inputToken1Address && tokenA === inputToken2Address)
        );

        if (!isPairValid) {
          alert("Please select the correct token pair from your valid pairs");
          return;
        }

        const token1 = tokens.find(
          token => token.address === inputToken1Address
        );
        const token2 = tokens.find(
          token => token.address === inputToken2Address
        );

        if (!token1 || !token2) {
          alert("Please select the correct token pair from your valid pairs");
          return;
        }

        const token1Address = token1.address ?? "";
        const token2Address = token2.address ?? "";

        setTxPending(true);

        await approveTokens(
          token1Address,
          token1.abi,
          swapRouter.address,
          liquidity
        );
        notifySuccess();

        await approveTokens(
          token2Address,
          token2.abi,
          swapRouter.address,
          liquidity
        );
        notifySuccess();

        if (token1.key !== "ETH" && token2.key !== "ETH") {
          removeLiquidity(token1Address, token2Address, liquidity);
          notifySuccess();
        } else if (token1.key === "ETH" && token2.key !== "ETH") {
          removeLiquidityETH(token1Address, liquidity);
          notifySuccess();
        } else if (token1.key !== "ETH" && token2.key === "ETH") {
          removeLiquidityETH(token1Address, liquidity);
          notifySuccess();
        }
        notifySuccess();

        setShowRemoveInput(prevState => ({
          ...prevState,
          [rowIndex]: false,
        }));
      } else {
        notifyError("Please select a valid token pair");
      }
    } catch (error) {
      console.error("Error removing liquidity: ", error);
      notifyError("Error removing liquidity");
      setTxPending(false);
    } finally {
      setTxPending(false);
      closeModal();
    }
  };

  const handleTokenSelection = (token: TokenProps, isToken1: boolean) => {
    if (isToken1) {
      setSelectedToken1(token);

      if (token) {
        setSelectedToken2Options(
          tokens.filter(t => t !== token && t !== selectedToken2)
        );
      } else {
        setSelectedToken2Options(tokens);
      }
    } else {
      setSelectedToken2(token);

      if (token) {
        setSelectedToken1Options(
          tokens.filter(t => t !== token && t !== selectedToken1)
        );
      } else {
        setSelectedToken1Options(tokens);
      }
    }
  };

  const isTokenPairAvailable = (
    token: TokenProps,
    selectedToken: TokenProps | null
  ) => {
    if (!selectedToken1) return true;

    const selectedTokenAddress = selectedToken1.address;
    const tokenAddress = token.address;

    const pairAvailable =
      tokenPairs.some(
        ([a, b]) => a === selectedTokenAddress && b === tokenAddress
      ) ||
      tokenPairs.some(
        ([a, b]) => a === tokenAddress && b === selectedTokenAddress
      );

    return pairAvailable;
  };

  useEffect(() => {
    if (!address) return;

    if (selectedToken1?.key !== "ETH") {
      getBalance(selectedToken1?.key ?? "", address)?.then(balance => {
        const parsedBalance = parseFloat(balance ?? "0").toFixed(2);
        setBalanceToken1(Number(parsedBalance));
      });
    } else {
      setBalanceToken1(null);
    }

    if (selectedToken2?.key !== "ETH") {
      getBalance(selectedToken2?.key ?? "", address)?.then(balance => {
        const parsedBalance = parseFloat(balance ?? "0").toFixed(2);
        setBalanceToken2(Number(parsedBalance));
      });
    } else {
      setBalanceToken2(null);
    }

    if (selectedToken1?.key === "ETH" || selectedToken2?.key === "ETH") {
      getEthBalance(address)?.then(balance => {
        const parsedBalance = parseFloat(balance ?? "0").toFixed(2);
        setEthBalance(Number(parsedBalance));
      });
    }
  }, [selectedToken1, selectedToken2, address]);

  useEffect(() => {
    if (!address) return;
    // fetch liquidity positions and update state
    getPositions(address);
  }, [address, selectedToken1, selectedToken2]);

  useEffect(() => {
    if (selectedToken1?.address && selectedToken2?.address) {
      getReserves(selectedToken1.address, selectedToken2.address);
    }
  }, [selectedToken1, selectedToken2]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!address) {
        notifyError("Connect Wallet");
      }
    }
  }, []);

  return (
    <>
      <div className="w-full mt-36 flex flex-col justify-center items-center px-2 ">
        <div className="w-full flex justify-around">
          <h1 className="text-zinc-300 text-3xl font-semibold">Pools</h1>
          <Button auto onPress={handleModal}>
            + New Pool
          </Button>
          <Modal
            closeButton
            blur
            aria-labelledby="modal-title"
            open={expand}
            onClose={closeModal}
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
            <Modal.Header>
              <Text
                size={20}
                css={{
                  color: "#fff",
                }}
              >
                Select Pair
              </Text>
            </Modal.Header>
            <Modal.Body>
              <div className="bg-[#212429] p-4 py-2 rounded-xl mb-2 border-[2px] border-transparent hover:border-zinc-600">
                <div className="flex  items-center rounded-xl">
                  <input
                    className="relative text-white  w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36]"
                    type="number"
                    placeholder="0.0"
                    onChange={e => setDesiredAmountA(Number(e.target.value))}
                  />
                  <div className="absolute right-10  ">
                    <Selector
                      id="token1"
                      setToken={token => handleTokenSelection(token, true)}
                      defaultValue={selectedToken1 || null}
                      ignoreValue={selectedToken2 ? selectedToken2.name : null}
                      tokens={tokens}
                    />
                  </div>
                </div>
                {selectedToken1?.key === "ETH" ? (
                  <div className="flex justify-end text-gray-400 text-sm">
                    Balance: {ethBalance}
                  </div>
                ) : (
                  <div className="flex justify-end text-gray-400 text-sm">
                    Balance: {balanceToken1}
                  </div>
                )}
              </div>
              <div className="bg-[#212429] p-4 py-2 rounded-xl mb-2 border-[2px] border-transparent hover:border-zinc-600">
                <div className="flex  items-center rounded-xl">
                  <input
                    className="relative text-white w-full outline-none rounded-xl h-12 px-2 appearance-none text-xl bg-[#2c2f36]"
                    type="number"
                    placeholder="0.0"
                    onChange={e => setDesiredAmountB(Number(e.target.value))}
                  />
                  <div className="absolute right-10 ">
                    <Selector
                      id="token2"
                      setToken={token => handleTokenSelection(token, false)}
                      defaultValue={selectedToken2 || null}
                      ignoreValue={selectedToken1 ? selectedToken1.name : null}
                      tokens={tokens.filter(token =>
                        isTokenPairAvailable(token, selectedToken1)
                      )}
                    />
                  </div>
                </div>
                {selectedToken2?.key === "ETH" ? (
                  <div className="flex justify-end text-gray-400 text-sm">
                    Balance: {ethBalance}
                  </div>
                ) : (
                  <div className="flex justify-end text-gray-400 text-sm">
                    Balance: {balanceToken2}
                  </div>
                )}
              </div>
              <div className="flex justify-center py-3">
                <button
                  className="p-4 m-4 w-full my-2 rounded-xl bg-blue-700 text-white"
                  onClick={handleAddLiquidity}
                >
                  Add Liquidity
                </button>
              </div>
            </Modal.Body>
          </Modal>

          {txPending && <TransactionStatus />}

          <Toaster />
        </div>
      </div>

      {renderTable && (
        <div className="w-full flex justify-center items-start px-2">
          <div className="overflow-x-auto relative w-full lg:w-8/12 rounded-md mx-auto text-white px-0 py-0 bg-[#212429] opacity-100 backdrop-blur-lg items-center justify-center mt-12 mb-32">
            <h2 className="rounded-t-md text-xl font-semibold tracking-wide w-full  py-4 px-4 border-b border-gray-400">
              Your Liquidity Positions
            </h2>
            <div className="lg:px-4 py-8 w-full">
              <div className="max-h-[450px] overflow-y-auto border-none rounded-xl">
                <table className="w-full text-sm text-left text-gray-100">
                  <thead className="text-sm uppercase text-gray-100 border-b border-gray-500">
                    <tr>
                      <th scope="col" className="py-3 px-10">
                        Token A
                      </th>
                      <th scope="col" className="py-3 px-10">
                        Token B
                      </th>
                      <th scope="col" className="py-3 px-10">
                        Liquidity Balance
                      </th>
                      <th scope="col" className="py-3 px-14">
                        Remove Liquidity
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {positionsWithLiquidity.map((position, index) => (
                      <tr
                        key={index}
                        className="border-b h-28 border-gray-500 text-gray-100"
                      >
                        <td scope="row" className="py-4 px-10 font-medium ">
                          <div className="flex items-center ">
                            <Image
                              src={
                                tokens.find(
                                  token => token.name === position.tokenA
                                )?.logo ?? ""
                              }
                              width={20}
                              height={20}
                              alt={`${position.tokenA} logo`}
                              style={{ marginRight: "10px" }}
                            />
                            {position.tokenA}
                          </div>
                        </td>
                        <td className="py-3 px-10 font-medium">
                          <div className="flex items-center ">
                            <Image
                              src={
                                tokens.find(
                                  token => token.name === position.tokenB
                                )?.logo ?? ""
                              }
                              width={20}
                              height={20}
                              alt={`${position.tokenB} logo`}
                              style={{ marginRight: "10px" }}
                            />
                            {position.tokenB}
                          </div>
                        </td>

                        <td className="py-3 px-16 font-medium">
                          {parseFloat(position.liquidity).toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          {showRemoveInput[index] ? (
                            <>
                              <Input
                                type="number"
                                className="mb-3 ml-1.5 justify-center items-center bg-transparent"
                                placeholder="0.0"
                                required
                                onChange={e => setLiquidity(e.target.value)}
                              />
                              <Button
                                type="button"
                                onClick={() =>
                                  handleRemoveLiquidity(
                                    position.tokenA,
                                    position.tokenB,
                                    position.liquidity,
                                    index
                                  )
                                }
                              >
                                Confirm Removal
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              onClick={() =>
                                setShowRemoveInput(prevState => {
                                  const newState = Array.isArray(prevState)
                                    ? [...prevState]
                                    : [];
                                  newState[index] = true;
                                  return newState;
                                })
                              }
                            >
                              Remove Liquidity
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Pool;
