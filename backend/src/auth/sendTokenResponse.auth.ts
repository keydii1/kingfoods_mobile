import { Response } from "express";
import { createAccessToken, createRefreshToken } from "../auth/TokenService";

const sendTokenResponse = async (res: Response, payload: any) => {
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.OK("Login successfully", { accessToken, user: payload });
};

export default sendTokenResponse;
