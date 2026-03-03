import github from "../assets/GitHub_Invertocat_White.svg";
import website from "../assets/website.svg";
import steam from "../assets/Steam_icon_logo.svg";

export const ICON_MAP = {
  github,
  website,
  steam,
} as const;

export type IconType = keyof typeof ICON_MAP;