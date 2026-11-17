"use client";

import { createContext, useContext } from "react";
import type { ProtoTone } from "@/components/ProtoPanel/protoStyles";

// Tom do painel que envolve o componente. Os componentes de dentro leem daqui
// para montar o `style` do próprio elemento raiz; o padrão é o IDH.
export const ProtoToneContext = createContext<ProtoTone>("idh");

/**
 * Tom do painel atual, para os componentes cliente do painel.
 *
 * @example const tone = useProtoTone(); <div style={protoToneStyle(tone)} />
 */
export const useProtoTone = (): ProtoTone => useContext(ProtoToneContext);
