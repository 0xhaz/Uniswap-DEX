import { ethers } from "ethers";

export function toWei(amount: string, decimals = 18) {
  try {
    const toWei = ethers.utils.parseUnits(amount, decimals);
    return toWei.toString();
  } catch (error) {
    console.error("Error converting amount to Wei", error);
    throw error;
  }
}

export function toEth(amount: string) {
  try {
    const toEth = ethers.utils.parseEther(amount);
    return toEth.toString();
  } catch (error) {
    console.error("Error converting amount to Eth", error);
    throw error;
  }
}
