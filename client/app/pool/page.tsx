"use client";
import { Fragment, useState, useEffect } from "react";
import Image from "next/image";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/solid";
import { Dialog, Listbox, Transition } from "@headlessui/react";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import { Contract, ethers } from "ethers";
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
} from "@/utils/queries";
import {
  CONTRACTS,
  tokens,
  TokenProps,
  tokenPairs,
} from "../constants/constants";
import Selector from "../components/selector";
import { formatEth, toEth, toWei } from "@/utils/ether-utils";

const swapRouter = contract("swapRouter");

const Pool = () => {
  const [expand, setExpand] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [toggle, setToggle] = useState<boolean>(false);
  const [selectedToken1, setSelectedToken1] = useState<TokenProps | null>(
    tokens[0]
  );
  const [selectedToken2, setSelectedToken2] = useState<TokenProps | null>(
    tokens[1]
  );
  const [txPending, setTxPending] = useState<boolean>(false);
  const [selected, setSelected] = useState([...tokens]);
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

  const { address } = useAccount();
  const provider = useProvider();
  const { data: signer } = useSigner();

  const renderTable = address !== undefined;

  const tokenAddressToName = {
    [CONTRACTS.USDT.address]: "USDT",
    [CONTRACTS.USDC.address]: "USDC",
    [CONTRACTS.LINK.address]: "LINK",
    [CONTRACTS.WETH.address]: "WETH",
  };

  const selectTokenPair = (tokenA: TokenProps, tokenB: TokenProps) => {
    const selectedPair = tokenPairs.find(
      pair =>
        (pair[0] === tokenA.address && pair[1] === tokenB.address) ||
        (pair[0] === tokenB.address && pair[1] === tokenA.address)
    );

    if (selectedPair) {
      setSelectedToken1(
        tokens.find(token => token.address === selectedPair[0]) || null
      );
      setSelectedToken2(
        tokens.find(token => token.address === selectedPair[1]) || null
      );
    } else {
      setSelectedToken1(null);
      setSelectedToken2(null);
    }
  };

  const getPositions = async (address: string) => {
    if (!address) return;

    const positions = [];
    const processedPairs = new Set();

    for (let i = 0; i < tokenPairs.length; i++) {
      const [tokenA, tokenB] = tokenPairs[i];
      const sortedPair = [tokenA, tokenB].sort();
      const pairIdentifier = sortedPair.join("-");

      try {
        if (!processedPairs.has(pairIdentifier)) {
          const liquidity = await getLiquidity(
            address,
            sortedPair[0],
            sortedPair[1]
          );
          console.log("TokenA:", sortedPair[0]);
          console.log("TokenB:", sortedPair[1]);
          console.log("Liquidity:", liquidity);

          if (parseFloat(liquidity) > 0) {
            positions.push({
              tokenA: tokenAddressToName[sortedPair[0]] || sortedPair[0],
              tokenB: tokenAddressToName[sortedPair[1]] || sortedPair[1],
              liquidity,
            });
          }
        }

        processedPairs.add(pairIdentifier);
      } catch (error) {
        console.error(error);
      }
    }

    console.log(positions);
    setPositions(positions);
  };

  const positionsWithLiquidity = positions.filter(
    position => parseFloat(position.liquidity) > 0
  );

  const handleModal = () => setExpand(true);
  const closeModal = () => setExpand(false);

  // get reserves for a pair of tokens when user select both tokens
  const getReserves = async (tokenA: string, tokenB: string) => {
    const swapRouter = contract("swapRouter");
    try {
      const response = await swapRouter?.getReserve(tokenA, tokenB);
      return {
        reserveA: response?.reserveA,
        reserveB: response?.reserveB,
      };
    } catch (error) {
      console.error(error);
      return {
        reserveA: 0,
        reserveB: 0,
      };
    }
  };

  const fetchReserves = async () => {
    if (selectedToken1 && selectedToken2 && selectedToken1 != selectedToken2) {
      const token1Address = selectedToken1.address || "";
      const token2Address = selectedToken2.address || "";

      const reserves = await getReserves(token1Address, token2Address);
      setReserveA(formatEth(reserves.reserveA));
      setReserveB(formatEth(reserves.reserveB));
    }
  };

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
    if (selectedToken1 === selectedToken2) {
      alert("Please select different tokens");
      return;
    }

    const token1Address = selectedToken1?.address || "";
    const token2Address = selectedToken2?.address || "";

    const possiblePairs = [
      [token1Address, token2Address],
      [token2Address, token1Address],
    ];

    let validPairIndex = -1;

    for (const [tokenA, tokenB] of possiblePairs) {
      validPairIndex = tokenPairs.findIndex(pair => {
        return pair[0] === tokenA && pair[1] === tokenB;
      });

      if (validPairIndex !== -1) {
        break;
      }
    }

    console.log("validPairIndex", validPairIndex);

    if (validPairIndex !== -1) {
      const [tokenA, tokenB] = tokenPairs[validPairIndex];

      const tokenAName = tokenAddressToName[tokenA] || tokenA;
      const tokenBName = tokenAddressToName[tokenB] || tokenB;

      console.log("tokenAName", tokenAName);
      console.log("tokenBName", tokenBName);
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

        await addLiquidity(
          token1Address,
          token2Address,
          desiredAmountA.toString(),
          desiredAmountB.toString()
        );

        await fetchReserves();
      } else if (selectedToken1?.key === "ETH") {
        await approveTokens(
          token2Address,
          selectedToken2?.abi,
          swapRouter.address,
          desiredAmountB.toString()
        );
        await addLiquidityETH(
          token2Address,
          desiredAmountB.toString(),
          desiredAmountA.toString()
        );

        await fetchReserves();
      } else if (selectedToken2?.key === "ETH") {
        await approveTokens(
          token1Address,
          selectedToken1?.abi,
          swapRouter.address,
          desiredAmountA.toString()
        );
        await addLiquidityETH(
          token1Address,
          desiredAmountA.toString(),
          desiredAmountB.toString()
        );

        await fetchReserves();
      }
    } else {
      alert("Please select the correct token pair from your valid pairs");
    }
  };

  const handleRemoveLiquidity = async (
    inputToken1Address: string,
    inputToken2Address: string,
    pairLiquidity: string,
    rowIndex: number
  ) => {
    if (inputToken1Address === inputToken2Address) {
      alert("Please select different tokens");
      return;
    }

    if (!address) return;

    if (
      inputToken1Address &&
      inputToken2Address &&
      inputToken1Address != inputToken2Address &&
      liquidity
    ) {
      console.log("Contents of tokens array:", tokens);
      const token1 = tokens.find(token => token.address === inputToken1Address);
      const token2 = tokens.find(token => token.address === inputToken2Address);

      console.log("token1", token1);
      console.log("token2", token2);

      if (!token1 || !token2) {
        alert("Invalid token address");
        return;
      }

      const token1Address: any = token1.address || "";
      const token1Abi = token1.abi || {};
      const token2Address: any = token2.address || "";
      const token2Abi = token2.abi || {};

      await approveTokens(
        token1Address,
        token1Abi,
        swapRouter.address,
        liquidity
      );

      await approveTokens(
        token2Address,
        token2Abi,
        swapRouter.address,
        liquidity
      );

      if (token1Address != "ETH" && token2Address != "ETH") {
        removeLiquidity(token1Address, token2Address, liquidity);
      } else if (token1Address === "ETH" && token2Address != "ETH") {
        removeLiquidityETH(token2Address, liquidity);
      } else if (token1Address !== "ETH" && token2Address == "ETH") {
        removeLiquidityETH(token1Address, liquidity);
      }

      setShowRemoveInput(prevState => ({
        ...prevState,
        [rowIndex]: false,
      }));
    }
  };

  const handleToken1Change = (token: TokenProps) => {
    setSelectedToken1(token);
    if (selectedToken2) {
      selectTokenPair(token, selectedToken2);
    }
  };

  const handleToken2Change = (token: TokenProps) => {
    setSelectedToken2(token);
    if (selectedToken1) {
      selectTokenPair(selectedToken1, token);
    }
  };

  const handleTokenSelection = (token: TokenProps, isToken1: boolean) => {
    if (isToken1) {
      setSelectedToken1(token);
    } else {
      setSelectedToken2(token);
    }
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
    fetchReserves();
  }, [address, selectedToken1, selectedToken2]);
  return (
    <>
      <div className="w-full mt-48 flex flex-col justify-center items-center px-2 ">
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
                      tokens={tokens}
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
                      <th scope="col" className="py-3 px-4">
                        Token A
                      </th>
                      <th scope="col" className="py-3 px-4">
                        Token B
                      </th>
                      <th scope="col" className="py-3 px-10">
                        Reserve A
                      </th>
                      <th scope="col" className="py-3 px-4">
                        Reserve B
                      </th>
                      <th scope="col" className="py-3 px-13">
                        Liquidity Balance
                      </th>
                      <th scope="col" className="py-3 px-12">
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
                        <td scope="row" className="py-4 px-6 font-medium ">
                          <div className="flex items-center -ml-2">
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
                            {tokenAddressToName[position.tokenA] ||
                              position.tokenA}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium">
                          <div className="flex items-center -ml-2">
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
                            {tokenAddressToName[position.tokenB] ||
                              position.tokenB}
                          </div>
                        </td>
                        <td className="py-4 px-14 font-medium">{reserveA}</td>
                        <td className="py-4 px-10  font-medium ">{reserveB}</td>
                        <td className="py-4 px-10 font-medium">
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
                                  const newState = [...prevState];
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
