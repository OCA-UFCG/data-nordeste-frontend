"use client";
import {
  ChildrenWrapper,
  HeaderItem,
  ItemWrapper,
  Modal,
  NavList,
  Navbar,
} from "./HeaderModal.styles";
import { ISection } from "@/utils/interfaces";
import { useState } from "react";

const NavItem = ({ item }: { item: { fields: ISection } }) => {
  const { children, path, name } = item.fields;

  if (!children) {
    return <HeaderItem href={path}>{name}</HeaderItem>;
  }

  return (
    <ItemWrapper>
      <HeaderItem href={path}>{name}</HeaderItem>
      <ChildrenWrapper>
        {children.map((child, key) => (
          <NavItem key={key} item={child} />
        ))}
      </ChildrenWrapper>
    </ItemWrapper>
  );
};

const HeaderModal = ({ content }: { content: { fields: ISection }[] }) => {
  const [retracted, setRetracted] = useState<boolean>(true);

  return (
    <Modal retracted={retracted} setRetracted={setRetracted}>
      <Navbar>
        <NavList>
          {content
            .sort((a, b) => a.fields.name.localeCompare(b.fields.name))
            .filter((a) => a.fields.appears)
            .map((item, key) => (
              <NavItem key={key} item={item} />
            ))}
        </NavList>
      </Navbar>
    </Modal>
  );
};

export default HeaderModal;
