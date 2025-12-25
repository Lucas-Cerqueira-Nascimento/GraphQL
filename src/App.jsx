import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { useState } from "react";
// Criamos o "gerente" que vai guardar os dados para não precisarmos baixar toda hora
const queryClient = new QueryClient();

// O endereço da "biblioteca" de Pokémons
const API_URL = "https://beta.pokeapi.co/graphql/v1beta";

// Esta função vai lá na internet buscar o Pokémon
const buscarPokemon = async (nome) => {
  /* Abaixo temos a "Query" (o pedido).
     Explicação dos símbolos:
     - $name: O '$' indica que isso é uma VARIÁVEL. É um buraquinho onde vamos colocar o nome depois.
     - String!: O '!' significa OBRIGATÓRIO. A API diz: "Não me chame se não tiver um nome de texto".
  */
  const pedidoGrafico = `
    query meuPedido($nomeVariavel: String!) {
      pokemon_v2_pokemon(where: {name: {_eq: $nomeVariavel}}) {
        name
        id
        pokemon_v2_pokemonsprites {
          sprites
        }
      }
    }
  `;

  const resposta = await fetch(API_URL, {
    method: "POST", // GraphQL exige POST para enviar a query no 'body'
    headers: {
      "Content-Type": "application/json", // Avisamos que estamos enviando um objeto JSON
    },
    body: JSON.stringify({
      query: pedidoGrafico, // O texto do pedido
      variables: { nomeVariavel: nome.toLowerCase() }, // O valor real que vai entrar no $
    }),
  });

  const resultado = await resposta.json();
  // O GraphQL sempre retorna os dados dentro de um objeto chamado 'data'
  const dados = resultado.data?.pokemon_v2_pokemon?.[0];

  if (!dados) throw new Error("Pokémon não encontrado!");
  return dados;
};

function TelaPrincipal() {
  const [nomeBusca, setNomeBusca] = useState("pikachu");

  // O useQuery faz o trabalho sujo de carregar e avisar se deu erro
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pokemon", nomeBusca],
    queryFn: () => buscarPokemon(nomeBusca),
  });

  console.log(data);

  return (
    <div
      style={{ fontFamily: "sans-serif", textAlign: "center", padding: "20px" }}
    >
      <h1>Minha PokéDex Simples</h1>

      <input
        type="text"
        placeholder="Digite um nome..."
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setNomeBusca(e.target.value);
          }
        }}
        style={{
          padding: "10px",
          borderRadius: "5px",
          border: "1px solid #ccc",
        }}
      />

      <div style={{ marginTop: "20px" }}>
        {/* Enquanto estiver baixando... */}
        {isLoading && <p>Carregando...</p>}

        {/* Se der erro, mostramos a mensagem (error.message é apenas o texto do erro) */}
        {isError && <p style={{ color: "red" }}>{error.message}</p>}

        {/* Se os dados chegarem com sucesso */}
        {data && !isLoading && (
          <div
            style={{
              border: "1px solid #eee",
              padding: "20px",
              borderRadius: "15px",
            }}
          >
            <span>#{data.id}</span>
            <h2 style={{ textTransform: "uppercase" }}>{data.name}</h2>
            {/* Abaixo pegamos a imagem. 
                Usamos JSON.parse apenas se o que vier da API for um texto (string).
                Se já for um objeto, usamos direto. Isso evita o erro que você teve!
            */}
            <img
              src={
                typeof data.pokemon_v2_pokemonsprites[0].sprites === "string"
                  ? JSON.parse(data.pokemon_v2_pokemonsprites[0].sprites)
                      .front_default
                  : data.pokemon_v2_pokemonsprites[0].sprites.front_default
              }
              alt={data.name}
              style={{ width: "150px" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// O App precisa estar "envolto" pelo Provider para o React Query funcionar
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TelaPrincipal />
    </QueryClientProvider>
  );
}
