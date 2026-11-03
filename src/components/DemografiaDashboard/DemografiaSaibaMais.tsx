import { PanelInfo } from "@/components/Panel/layout/PanelInfo";

// Textos do Power BI, sem alterações.
export const DemografiaSaibaMais = () => (
  <PanelInfo label="Saiba mais">
    <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
      <p className="text-base font-semibold text-[#018f39]">Glossário</p>
      <p>
        <strong>Perfil Demográfico</strong>: apresenta o quantitativo
        populacional com base em características gerais da população, como:
      </p>
      <ul className="list-disc pl-5">
        <li>Por idade e sexo;</li>
        <li>
          Cor ou raça, a partir da autodeclaração segundo categorias utilizadas
          pelo IBGE (preta, parda, branca, amarela e indígena).
        </li>
      </ul>
      <p>
        É importante observar que a forma de autodeclaração mudou ao longo dos
        censos. Dessa forma, parte do crescimento registrado em alguns grupos
        raciais reflete uma mudança metodológica e cultural na forma de
        autodeclaração, e não apenas alterações demográficas reais.
      </p>
      <p>
        Além disso, a composição municipal também varia entre os censos. Alguns
        municípios foram criados ou desmembrados em anos específicos e,
        portanto, não aparecem em períodos anteriores.
      </p>
      <p>
        Por fim, os <strong>municípios</strong> são classificados por{" "}
        <strong>porte</strong> populacional:
      </p>
      <ul className="list-disc pl-5">
        <li>Pequeno porte, até 50 mil habitantes;</li>
        <li>Médio porte, entre 50 mil e 100 mil habitantes;</li>
        <li>Grande porte, acima de 100 mil habitantes.</li>
      </ul>
    </div>
  </PanelInfo>
);
