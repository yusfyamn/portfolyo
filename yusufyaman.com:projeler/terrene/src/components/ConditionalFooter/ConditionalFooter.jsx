"use client";
import { usePathname } from "next/navigation";

import Footer from "@/components/Footer/Footer";
import { withoutBasePath } from "@/lib/basePath";

const ConditionalFooter = () => {
  const pathname = withoutBasePath(usePathname());
  const showFooter = pathname !== "/blueprints";

  return showFooter ? <Footer /> : null;
};

export default ConditionalFooter;
