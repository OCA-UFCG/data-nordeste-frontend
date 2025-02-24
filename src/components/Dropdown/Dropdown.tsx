import { ISection } from "@/utils/interfaces";
import {
  ChildrenWrapper,
  ItemContent,
  NavItem,
  Wrapper,
} from "./Dropdown.styles";
import { Icon } from "../Icon/Icon";
import Link from "next/link";

export const Dropdown = ({ item }: { item: { fields: ISection } }) => {
  console.log(item);
  const { name, path, children } = item.fields;

  if (!children) {
    return (
      <NavItem>
        <ItemContent>
          {path ? <Link href={path}>{name}</Link> : <span>{name}</span>}
        </ItemContent>
      </NavItem>
    );
  }

  return (
    <NavItem>
      <ItemContent>
        {path ? <Link href={path}>{name}</Link> : <span>{name}</span>}
        <Icon id="arrow-head" width={11} height={9} />
      </ItemContent>
      {children && (
        <Wrapper>
          <ChildrenWrapper>
            {children.map((item, key) => (
              <Dropdown key={key} item={item} />
            ))}
          </ChildrenWrapper>
        </Wrapper>
      )}
    </NavItem>
  );
};
