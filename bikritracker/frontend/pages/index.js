// pages/index.js
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Index(){
  const r = useRouter();
  useEffect(()=> r.replace("/inventory"), [r]);
  return null;
}
