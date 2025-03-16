import { Icon } from "../Icon/Icon";
import { Expand, Header, Text, Wrapper } from "./Filter.styles";

export const Filter = () => {
  return (
    <Wrapper>
      <Header>
        <Icon id="filter" size={14} />
        <Text>Filtrar por</Text>
        <Expand id="expand" width={12} height={6} />
      </Header>

      {/* <input type="date" /> */}
    </Wrapper>
  );
};
