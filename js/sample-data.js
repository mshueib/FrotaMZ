// Gerado a partir de data/sample.json (npm run sample). Dados de exemplo para o modo demonstração.
window.SAMPLE = {
  "config": {
    "nome": "Rent-a-Car Exemplo, Lda",
    "nuit": "400000000",
    "endereco": "Av. Julius Nyerere, 1250, Maputo",
    "telefone": "+258 84 000 0000",
    "iva": 16
  },
  "viaturas": [
    {
      "id": "v1",
      "matricula": "AGM 214 MC",
      "marca": "Toyota",
      "modelo": "Hilux 2.4 GD-6",
      "ano": 2022,
      "categoria": "Pick-up",
      "combustivel": "Diesel",
      "km": 68450,
      "estado": "disponivel",
      "tarifa": 4500,
      "seguro": "2026-10-08",
      "inspecao": "2027-02-14",
      "licenca": "2026-12-31"
    },
    {
      "id": "v2",
      "matricula": "AFX 903 MC",
      "marca": "Toyota",
      "modelo": "Corolla 1.8",
      "ano": 2021,
      "categoria": "Ligeiro",
      "combustivel": "Gasolina",
      "km": 91200,
      "estado": "alugada",
      "tarifa": 3200,
      "seguro": "2027-03-01",
      "inspecao": "2026-09-30",
      "licenca": "2026-12-31"
    },
    {
      "id": "v3",
      "matricula": "AEK 557 MP",
      "marca": "Toyota",
      "modelo": "Land Cruiser Prado",
      "ano": 2020,
      "categoria": "SUV",
      "combustivel": "Diesel",
      "km": 142800,
      "estado": "manutencao",
      "tarifa": 7500,
      "seguro": "2027-01-20",
      "inspecao": "2027-01-05",
      "licenca": "2026-12-31"
    },
    {
      "id": "v4",
      "matricula": "AHB 128 MC",
      "marca": "Nissan",
      "modelo": "NP300 Hardbody",
      "ano": 2023,
      "categoria": "Pick-up",
      "combustivel": "Diesel",
      "km": 31900,
      "estado": "disponivel",
      "tarifa": 4000,
      "seguro": "2027-05-11",
      "inspecao": "2027-06-02",
      "licenca": "2026-12-31"
    },
    {
      "id": "v5",
      "matricula": "AGD 771 MC",
      "marca": "Hyundai",
      "modelo": "i10 1.2",
      "ano": 2022,
      "categoria": "Económico",
      "combustivel": "Gasolina",
      "km": 54300,
      "estado": "alugada",
      "tarifa": 2200,
      "seguro": "2026-09-20",
      "inspecao": "2027-04-18",
      "licenca": "2026-12-31"
    },
    {
      "id": "v6",
      "matricula": "ADR 342 MP",
      "marca": "Toyota",
      "modelo": "Hiace 15 lugares",
      "ano": 2019,
      "categoria": "Minibus",
      "combustivel": "Diesel",
      "km": 188600,
      "estado": "disponivel",
      "tarifa": 6000,
      "seguro": "2027-02-28",
      "inspecao": "2026-11-15",
      "licenca": "2026-12-31"
    }
  ],
  "motoristas": [
    {
      "id": "m1",
      "nome": "Armando Sitoe",
      "telefone": "+258 84 520 1133",
      "documento": "110100456789B",
      "carta": "MP-0045821",
      "cartaCategoria": "B, C1",
      "cartaValidade": "2029-03-14",
      "tarifa": 1500,
      "estado": "ativo"
    },
    {
      "id": "m2",
      "nome": "Celso Mabunda",
      "telefone": "+258 82 771 4410",
      "documento": "110203998812M",
      "carta": "MC-0118340",
      "cartaCategoria": "B, C, D",
      "cartaValidade": "2028-07-02",
      "tarifa": 1800,
      "estado": "ativo"
    },
    {
      "id": "m3",
      "nome": "Fátima Nhaca",
      "telefone": "+258 86 403 2291",
      "documento": "100104556710F",
      "carta": "MC-0093215",
      "cartaCategoria": "B",
      "cartaValidade": "2027-11-20",
      "tarifa": 1500,
      "estado": "ativo",
      "feriasInicio": "2026-09-15",
      "feriasFim": "2026-10-09"
    },
    {
      "id": "m4",
      "nome": "Ernesto Guambe",
      "telefone": "+258 84 910 5507",
      "documento": "110500112233C",
      "carta": "GZ-0021478",
      "cartaCategoria": "B, C1",
      "cartaValidade": "2026-10-12",
      "tarifa": 1500,
      "estado": "ativo",
      "feriasInicio": "2026-10-20",
      "feriasFim": "2026-11-03"
    },
    {
      "id": "m5",
      "nome": "Luís Tembe",
      "telefone": "+258 82 300 8812",
      "documento": "110100778899T",
      "carta": "MP-0070012",
      "cartaCategoria": "B",
      "cartaValidade": "2027-05-30",
      "tarifa": 1400,
      "estado": "inativo"
    }
  ],
  "abastecimentos": [
    {
      "id": "a01",
      "viaturaId": "v1",
      "data": "2026-08-12",
      "km": 67200,
      "litros": 60,
      "precoLitro": 87.97,
      "posto": "Petromoc Julius Nyerere"
    },
    {
      "id": "a02",
      "viaturaId": "v1",
      "data": "2026-08-29",
      "km": 67820,
      "litros": 58,
      "precoLitro": 87.97,
      "posto": "Total Marginal"
    },
    {
      "id": "a03",
      "viaturaId": "v1",
      "data": "2026-09-15",
      "km": 68430,
      "litros": 61,
      "precoLitro": 87.97,
      "posto": "Petromoc Julius Nyerere"
    },
    {
      "id": "a04",
      "viaturaId": "v2",
      "data": "2026-08-20",
      "km": 89900,
      "litros": 42,
      "precoLitro": 86.97,
      "posto": "Galp Matola"
    },
    {
      "id": "a05",
      "viaturaId": "v2",
      "data": "2026-09-06",
      "km": 90560,
      "litros": 45,
      "precoLitro": 86.97,
      "posto": "Total Marginal"
    },
    {
      "id": "a06",
      "viaturaId": "v2",
      "data": "2026-09-22",
      "km": 91180,
      "litros": 43,
      "precoLitro": 86.97,
      "posto": "Petromoc 24 de Julho"
    },
    {
      "id": "a07",
      "viaturaId": "v3",
      "data": "2026-08-05",
      "km": 141200,
      "litros": 80,
      "precoLitro": 87.97,
      "posto": "Petromoc Julius Nyerere"
    },
    {
      "id": "a08",
      "viaturaId": "v3",
      "data": "2026-08-30",
      "km": 142000,
      "litros": 88,
      "precoLitro": 87.97,
      "posto": "Engen Machava"
    },
    {
      "id": "a09",
      "viaturaId": "v3",
      "data": "2026-09-14",
      "km": 142780,
      "litros": 86,
      "precoLitro": 87.97,
      "posto": "Engen Machava"
    },
    {
      "id": "a10",
      "viaturaId": "v4",
      "data": "2026-08-25",
      "km": 31100,
      "litros": 55,
      "precoLitro": 87.97,
      "posto": "Galp Matola"
    },
    {
      "id": "a11",
      "viaturaId": "v4",
      "data": "2026-09-12",
      "km": 31880,
      "litros": 70,
      "precoLitro": 87.97,
      "posto": "Galp Matola"
    },
    {
      "id": "a12",
      "viaturaId": "v5",
      "data": "2026-09-01",
      "km": 53700,
      "litros": 28,
      "precoLitro": 86.97,
      "posto": "Total Marginal"
    },
    {
      "id": "a13",
      "viaturaId": "v5",
      "data": "2026-09-23",
      "km": 54280,
      "litros": 31,
      "precoLitro": 86.97,
      "posto": "Petromoc 24 de Julho"
    },
    {
      "id": "a14",
      "viaturaId": "v6",
      "data": "2026-08-14",
      "km": 187500,
      "litros": 65,
      "precoLitro": 87.97,
      "posto": "Engen Machava"
    },
    {
      "id": "a15",
      "viaturaId": "v6",
      "data": "2026-08-18",
      "km": 188580,
      "litros": 118,
      "precoLitro": 87.97,
      "posto": "Petromoc Xai-Xai"
    }
  ],
  "despesas": [
    {
      "id": "d1",
      "viaturaId": "v6",
      "data": "2026-08-16",
      "categoria": "Portagem",
      "valor": 400,
      "descricao": "Portagem de Maputo (EN4) ida e volta"
    },
    {
      "id": "d2",
      "viaturaId": "v1",
      "data": "2026-09-03",
      "categoria": "Portagem",
      "valor": 160,
      "descricao": "Ponte Maputo-KaTembe"
    },
    {
      "id": "d3",
      "viaturaId": "v2",
      "data": "2026-09-10",
      "categoria": "Lavagem",
      "valor": 350,
      "descricao": "Lavagem completa"
    },
    {
      "id": "d4",
      "viaturaId": "v5",
      "data": "2026-08-28",
      "categoria": "Multa",
      "valor": 1000,
      "descricao": "Estacionamento indevido (a imputar ao cliente)"
    },
    {
      "id": "d5",
      "viaturaId": "v3",
      "data": "2026-09-18",
      "categoria": "Pneus",
      "valor": 28000,
      "descricao": "4 pneus 265/65 R17"
    },
    {
      "id": "d6",
      "viaturaId": "v4",
      "data": "2026-09-11",
      "categoria": "Acidente",
      "valor": 12500,
      "descricao": "Reparação para-choques traseiro"
    }
  ],
  "planos": [
    {
      "id": "p1",
      "viaturaId": "v1",
      "tipo": "Óleo e filtros",
      "intervaloKm": 10000,
      "intervaloMeses": 6,
      "ultimoKm": 60000,
      "ultimaData": "2026-04-10"
    },
    {
      "id": "p2",
      "viaturaId": "v2",
      "tipo": "Óleo e filtros",
      "intervaloKm": 10000,
      "intervaloMeses": 6,
      "ultimoKm": 82000,
      "ultimaData": "2026-05-02"
    },
    {
      "id": "p3",
      "viaturaId": "v3",
      "tipo": "Revisão geral",
      "intervaloKm": 15000,
      "intervaloMeses": 12,
      "ultimoKm": 127000,
      "ultimaData": "2025-11-20"
    },
    {
      "id": "p4",
      "viaturaId": "v4",
      "tipo": "Revisão geral",
      "intervaloKm": 15000,
      "intervaloMeses": 12,
      "ultimoKm": 30000,
      "ultimaData": "2026-07-15"
    },
    {
      "id": "p5",
      "viaturaId": "v5",
      "tipo": "Óleo e filtros",
      "intervaloKm": 10000,
      "intervaloMeses": 6,
      "ultimoKm": 50000,
      "ultimaData": "2026-06-01"
    },
    {
      "id": "p6",
      "viaturaId": "v6",
      "tipo": "Correia de distribuição",
      "intervaloKm": 90000,
      "intervaloMeses": 60,
      "ultimoKm": 100000,
      "ultimaData": "2022-03-10"
    }
  ],
  "servicos": [
    {
      "id": "s1",
      "viaturaId": "v1",
      "data": "2026-04-10",
      "km": 60000,
      "tipo": "Óleo e filtros",
      "oficina": "Toyota Moçambique",
      "custo": 9800
    },
    {
      "id": "s2",
      "viaturaId": "v4",
      "data": "2026-07-15",
      "km": 30000,
      "tipo": "Revisão geral",
      "oficina": "Nissan Maputo",
      "custo": 18500
    },
    {
      "id": "s3",
      "viaturaId": "v3",
      "data": "2026-09-19",
      "km": 142800,
      "tipo": "Travões (pastilhas e discos)",
      "oficina": "Auto Moz Machava",
      "custo": 21400
    },
    {
      "id": "s4",
      "viaturaId": "v5",
      "data": "2026-06-01",
      "km": 50000,
      "tipo": "Óleo e filtros",
      "oficina": "Oficina Central Polana",
      "custo": 5200
    }
  ],
  "clientes": [
    {
      "id": "c1",
      "nome": "Construções Matola, Lda",
      "nuit": "400123456",
      "documento": "Alvará 1234/2019",
      "telefone": "+258 84 311 2200",
      "carta": "",
      "cartaValidade": ""
    },
    {
      "id": "c2",
      "nome": "Helena Macuácua",
      "nuit": "100987654",
      "documento": "BI 110100123456A",
      "telefone": "+258 82 455 7781",
      "carta": "MP-0098765",
      "cartaValidade": "2029-03-14"
    },
    {
      "id": "c3",
      "nome": "Associação Saúde Comunitária de Gaza",
      "nuit": "500234567",
      "documento": "Registo 88/2015",
      "telefone": "+258 86 120 3344",
      "carta": "",
      "cartaValidade": ""
    },
    {
      "id": "c4",
      "nome": "Tiago Nhantumbo",
      "nuit": "101223344",
      "documento": "Passaporte 13AB45678",
      "telefone": "+258 87 600 1122",
      "carta": "MC-0123456",
      "cartaValidade": "2026-12-02"
    }
  ],
  "reservas": [
    {
      "id": "r1",
      "clienteId": "c2",
      "viaturaId": "v2",
      "inicio": "2026-09-22",
      "fim": "2026-09-29",
      "tarifa": 3200,
      "caucao": 10000,
      "estado": "curso",
      "kmSaida": 91180,
      "condutores": "Helena Macuácua",
      "motoristaId": "m1",
      "tarifaMotorista": 1500
    },
    {
      "id": "r2",
      "clienteId": "c4",
      "viaturaId": "v5",
      "inicio": "2026-09-20",
      "fim": "2026-09-24",
      "tarifa": 2200,
      "caucao": 5000,
      "estado": "curso",
      "kmSaida": 54280,
      "condutores": "Tiago Nhantumbo"
    },
    {
      "id": "r3",
      "clienteId": "c1",
      "viaturaId": "v1",
      "inicio": "2026-09-28",
      "fim": "2026-10-05",
      "tarifa": 4200,
      "caucao": 15000,
      "estado": "reservada",
      "condutores": "Eng. Abel Cossa; Sr. Rui Mondlane",
      "motoristaId": "m2",
      "tarifaMotorista": 1800
    },
    {
      "id": "r4",
      "clienteId": "c1",
      "viaturaId": "v4",
      "inicio": "2026-09-01",
      "fim": "2026-09-10",
      "tarifa": 4000,
      "caucao": 15000,
      "estado": "concluida",
      "kmSaida": 30200,
      "kmEntrada": 31100,
      "extras": 0,
      "extrasDesc": "",
      "faturaId": "f2",
      "condutores": "Eng. Abel Cossa"
    },
    {
      "id": "r5",
      "clienteId": "c3",
      "viaturaId": "v6",
      "inicio": "2026-08-15",
      "fim": "2026-08-18",
      "tarifa": 6000,
      "caucao": 20000,
      "estado": "concluida",
      "kmSaida": 187450,
      "kmEntrada": 188580,
      "extras": 1500,
      "extrasDesc": "Limpeza extra",
      "faturaId": "f1",
      "condutores": "Sr. Jaime Chissano"
    },
    {
      "id": "r6",
      "clienteId": "c3",
      "viaturaId": "v4",
      "inicio": "2026-09-12",
      "fim": "2026-09-16",
      "tarifa": 4000,
      "caucao": 15000,
      "estado": "concluida",
      "kmSaida": 31100,
      "kmEntrada": 31640,
      "extras": 0,
      "extrasDesc": "",
      "condutores": "",
      "motoristaId": "m2",
      "tarifaMotorista": 1800
    }
  ],
  "faturas": [
    {
      "id": "f1",
      "numero": "FT 2026/0001",
      "data": "2026-08-18",
      "clienteId": "c3",
      "reservaId": "r5",
      "viaturaId": "v6",
      "iva": 16,
      "estado": "paga",
      "linhas": [
        {
          "desc": "Aluguer Toyota Hiace 15 lugares (ADR 342 MP), 15/08 a 18/08",
          "qtd": 3,
          "preco": 6000
        },
        {
          "desc": "Limpeza extra",
          "qtd": 1,
          "preco": 1500
        }
      ]
    },
    {
      "id": "f2",
      "numero": "FT 2026/0002",
      "data": "2026-09-10",
      "clienteId": "c1",
      "reservaId": "r4",
      "viaturaId": "v4",
      "iva": 16,
      "estado": "pendente",
      "linhas": [
        {
          "desc": "Aluguer Nissan NP300 Hardbody (AHB 128 MC), 01/09 a 10/09",
          "qtd": 9,
          "preco": 4000
        }
      ]
    }
  ]
};
