import { Dispatch, SetStateAction, useRef } from "react";
import { Icon } from "../Icon/Icon";
import {
  CategoryTitle,
  Content,
  ContentWrapper,
  Expand,
  Form,
  Header,
  Label,
  Select,
  Text,
  TextContainer,
  Wrapper,
  Category,
  CategoriesWrapper,
  DateTitle,
  Date,
  DateLabel,
  DatesWrapper,
  SubmitButton,
  FormHeader,
  Close,
} from "./FilterMenu.styles";

const CATEGORIES = {
  "Outras publicações": "additional-content",
  "Paineis de dados": "data-panel",
  Boletins: "newsletter",
};

export const FilterForm = ({
  onSubmit,
  onChange,
}: {
  onSubmit: Dispatch<
    SetStateAction<{
      [x: string]: any;
    }>
  >;
  onChange: (state: boolean) => void;
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (!formRef.current) return;

    const formData = new FormData(formRef.current);

    const categories: string[] = [];

    Object.values(CATEGORIES).forEach((category) => {
      if (formData.get(category)) {
        categories.push(category);
      }
    });

    const finalForm: { [key: string]: any } = {};

    if (categories.length > 0) {
      finalForm["fields.type[in]"] = categories.join(",");
    }

    if (formData.get("init")) {
      finalForm["fields.date[gte]"] = formData.get("init");
    }

    if (formData.get("end")) {
      finalForm["fields.date[lte]"] = formData.get("end");
    }

    onSubmit(finalForm);
  };

  return (
    <Form ref={formRef} onSubmit={handleSubmit}>
      <FormHeader>
        <CategoryTitle>Categoria</CategoryTitle>
        <Close id="close" size={16} onClick={() => onChange(false)} />
      </FormHeader>
      <CategoriesWrapper>
        {Object.entries(CATEGORIES).map(([key, value], index) => (
          <Label key={index}>
            <Select type="checkbox" name={value} value={value} />
            <Category>{key}</Category>
          </Label>
        ))}
      </CategoriesWrapper>
      <CategoryTitle>Data</CategoryTitle>
      <DatesWrapper>
        <DateLabel>
          <DateTitle>Início</DateTitle>
          <Date name="init" type="date" />
        </DateLabel>
        <DateLabel>
          <DateTitle>Fim</DateTitle>
          <Date name="end" type="date" />
        </DateLabel>
      </DatesWrapper>
      <SubmitButton type="submit">Filtrar</SubmitButton>
    </Form>
  );
};

export const FilterMenu = ({
  onSubmit,
}: {
  onSubmit: Dispatch<
    SetStateAction<{
      [x: string]: any;
    }>
  >;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSubmit = (e: any) => {
    if (inputRef.current?.checked) {
      inputRef.current.checked = !inputRef.current.checked;
    }
    onSubmit(e);
  };

  const handleChange = (newState: boolean) => {
    if (inputRef.current) {
      inputRef.current.checked = newState;
    }
  };

  return (
    <Wrapper onMouseEnter={() => handleChange(true)}>
      <input ref={inputRef} type="checkbox" id="toggle" hidden />
      <Header htmlFor="toggle">
        <Icon id="filter" size={14} />
        <TextContainer>
          <Text>Filtrar por</Text>
          <Expand id="expand" width={12} height={6} />
        </TextContainer>
      </Header>
      <Content>
        <ContentWrapper>
          <FilterForm onSubmit={handleSubmit} onChange={handleChange} />
        </ContentWrapper>
      </Content>
    </Wrapper>
  );
};
