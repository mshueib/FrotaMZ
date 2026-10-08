// Gerado a partir de data/sample.json (npm run sample). Dados de exemplo para o modo demonstração.
window.SAMPLE = {
  "config": {
    "nome": "Rent-a-Car Exemplo, Lda",
    "nuit": "400000000",
    "endereco": "Av. 7 de Setembro, 210, Quelimane",
    "telefone": "+258 84 000 0000",
    "iva": 16,
    "toleranciaConsumo": 20,
    "subsidioDia": 500
  },
  "viaturas": [
    {
      "id": "v1",
      "matricula": "AGM 214 ZB",
      "marca": "Toyota",
      "modelo": "Hilux 2.4 GD-6",
      "ano": 2022,
      "categoria": "Pick-up",
      "combustivel": "Diesel",
      "km": 68450,
      "estado": "disponivel",
      "seguro": "2026-10-08",
      "inspecao": "2027-02-14",
      "licenca": "2026-12-31",
      "tarifa": 4500,
      "consumoRef": 9.5
    },
    {
      "id": "v2",
      "matricula": "AFX 903 ZB",
      "marca": "Toyota",
      "modelo": "Corolla 1.8",
      "ano": 2021,
      "categoria": "Ligeiro",
      "combustivel": "Gasolina",
      "km": 91200,
      "estado": "alugada",
      "seguro": "2027-03-01",
      "inspecao": "2026-09-30",
      "licenca": "2026-12-31",
      "tarifa": 3200,
      "consumoRef": 7
    },
    {
      "id": "v3",
      "matricula": "AEK 557 ZB",
      "marca": "Toyota",
      "modelo": "Land Cruiser Prado",
      "ano": 2020,
      "categoria": "SUV",
      "combustivel": "Diesel",
      "km": 142800,
      "estado": "manutencao",
      "seguro": "2027-01-20",
      "inspecao": "2027-01-05",
      "licenca": "2026-12-31",
      "tarifa": 7500,
      "consumoRef": 11.5
    },
    {
      "id": "v4",
      "matricula": "AHB 128 ZB",
      "marca": "Nissan",
      "modelo": "NP300 Hardbody",
      "ano": 2023,
      "categoria": "Pick-up",
      "combustivel": "Diesel",
      "km": 31900,
      "estado": "disponivel",
      "seguro": "2027-05-11",
      "inspecao": "2027-06-02",
      "licenca": "2026-12-31",
      "tarifa": 4000,
      "consumoRef": 7.2
    },
    {
      "id": "v5",
      "matricula": "AGD 771 ZB",
      "marca": "Hyundai",
      "modelo": "i10 1.2",
      "ano": 2022,
      "categoria": "Económico",
      "combustivel": "Gasolina",
      "km": 54300,
      "estado": "alugada",
      "seguro": "2026-09-20",
      "inspecao": "2027-04-18",
      "licenca": "2026-12-31",
      "tarifa": 2200,
      "consumoRef": 5.5
    },
    {
      "id": "v6",
      "matricula": "ADR 342 ZB",
      "marca": "Toyota",
      "modelo": "Hiace 15 lugares",
      "ano": 2019,
      "categoria": "Minibus",
      "combustivel": "Diesel",
      "km": 188600,
      "estado": "disponivel",
      "seguro": "2027-02-28",
      "inspecao": "2026-11-15",
      "licenca": "2026-12-31",
      "tarifa": 6000,
      "consumoRef": 10.5
    }
  ],
  "motoristas": [
    {
      "id": "m1",
      "nome": "Armando Sitoe",
      "telefone": "+258 84 520 1133",
      "documento": "110100456789B",
      "carta": "ZB-0045821",
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
      "carta": "ZB-0118340",
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
      "carta": "ZB-0093215",
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
      "carta": "ZB-0021478",
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
      "carta": "ZB-0070012",
      "cartaCategoria": "B",
      "cartaValidade": "2027-05-30",
      "tarifa": 1400,
      "estado": "inativo"
    }
  ],
  "postos": [
    {
      "id": "p1",
      "nome": "Petromoc Samora Machel",
      "localizacao": "Av. Samora Machel, Quelimane",
      "telefone": "+258 24 21 2100",
      "nuit": "400011223",
      "historico": [
        {
          "data": "2026-01-10",
          "precoDiesel": 87.97,
          "precoGasolina": 86.97
        }
      ],
      "precoDiesel": 87.97,
      "precoGasolina": 86.97,
      "precoData": "2026-01-10",
      "estado": "ativo"
    },
    {
      "id": "p2",
      "nome": "Petromoc 25 de Setembro",
      "localizacao": "Av. 25 de Setembro, Quelimane",
      "telefone": "+258 24 21 3220",
      "nuit": "400011224",
      "historico": [
        {
          "data": "2026-01-10",
          "precoDiesel": 87.97,
          "precoGasolina": 86.97
        }
      ],
      "precoDiesel": 87.97,
      "precoGasolina": 86.97,
      "precoData": "2026-01-10",
      "estado": "ativo"
    },
    {
      "id": "p3",
      "nome": "Galp Coalane",
      "localizacao": "Bairro Coalane, Quelimane",
      "telefone": "+258 24 22 0540",
      "nuit": "400238871",
      "historico": [
        {
          "data": "2026-06-01",
          "precoDiesel": 86.5,
          "precoGasolina": 85.5
        },
        {
          "data": "2026-08-01",
          "precoDiesel": 87.97,
          "precoGasolina": 86.97
        }
      ],
      "precoDiesel": 87.97,
      "precoGasolina": 86.97,
      "precoData": "2026-08-01",
      "estado": "ativo"
    },
    {
      "id": "p4",
      "nome": "TotalEnergies Marginal",
      "localizacao": "Av. Marginal, Quelimane",
      "telefone": "+258 24 21 8300",
      "nuit": "400156002",
      "historico": [
        {
          "data": "2026-01-10",
          "precoDiesel": 87.97,
          "precoGasolina": 86.97
        },
        {
          "data": "2026-09-20",
          "precoDiesel": 87.5,
          "precoGasolina": 86.5
        }
      ],
      "precoDiesel": 87.5,
      "precoGasolina": 86.5,
      "precoData": "2026-09-20",
      "estado": "ativo"
    },
    {
      "id": "p5",
      "nome": "Engen Chuabo Dembe",
      "localizacao": "Bairro Chuabo Dembe, Quelimane",
      "telefone": "+258 24 22 1880",
      "nuit": "400372210",
      "historico": [
        {
          "data": "2026-01-10",
          "precoDiesel": 87.97,
          "precoGasolina": 86.97
        }
      ],
      "precoDiesel": 87.97,
      "precoGasolina": 86.97,
      "precoData": "2026-01-10",
      "estado": "ativo"
    },
    {
      "id": "p6",
      "nome": "Petromoc Nicoadala",
      "localizacao": "Estrada Quelimane–Nicoadala, Zambézia",
      "telefone": "+258 24 23 0150",
      "historico": [
        {
          "data": "2026-01-10",
          "precoDiesel": 87.97,
          "precoGasolina": 86.97
        }
      ],
      "estado": "inativo",
      "precoDiesel": 87.97,
      "precoGasolina": 86.97,
      "precoData": "2026-01-10"
    }
  ],
  "requisicoes": [
    {
      "id": "rq1",
      "numero": "RC 2026/0001",
      "data": "2026-08-25",
      "viaturaId": "v4",
      "motoristaId": "m2",
      "posto": "Galp Coalane",
      "litros": 55,
      "precoLitro": 87.97,
      "finalidade": "Serviço interno",
      "estado": "paga",
      "dataAbast": "2026-08-25",
      "km": 31100,
      "litrosReais": 55,
      "precoReal": 87.97,
      "valorReal": 4838.35,
      "abastecimentoId": "a10",
      "dataVerif": "2026-08-25",
      "faturaNr": "FT GM/2026/0412",
      "reciboNr": "RE GM/2026/0389",
      "dataPag": "2026-09-05",
      "valorPago": 4838.35,
      "formaPag": "Transferência bancária",
      "postoId": "p3",
      "combustivel": "Diesel"
    },
    {
      "id": "rq2",
      "numero": "RC 2026/0002",
      "data": "2026-09-12",
      "viaturaId": "v4",
      "motoristaId": "m2",
      "posto": "Galp Coalane",
      "litros": 60,
      "precoLitro": 87.97,
      "finalidade": "Deslocação a Mocuba",
      "estado": "verificada",
      "dataAbast": "2026-09-12",
      "km": 31880,
      "litrosReais": 70,
      "precoReal": 87.97,
      "valorReal": 6157.9,
      "abastecimentoId": "a11",
      "dataVerif": "2026-09-12",
      "obsVerif": "Talão indica 70 L; pedido era de 60 L",
      "postoId": "p3",
      "combustivel": "Diesel"
    },
    {
      "id": "rq3",
      "numero": "RC 2026/0003",
      "data": "2026-09-22",
      "viaturaId": "v2",
      "motoristaId": "m1",
      "posto": "Petromoc 25 de Setembro",
      "litros": 43,
      "precoLitro": 86.97,
      "finalidade": "Aluguer com motorista (Helena Macuácua)",
      "estado": "verificada",
      "dataAbast": "2026-09-22",
      "km": 91180,
      "litrosReais": 43,
      "precoReal": 86.97,
      "valorReal": 3739.71,
      "abastecimentoId": "a06",
      "dataVerif": "2026-09-22",
      "postoId": "p2",
      "combustivel": "Gasolina"
    },
    {
      "id": "rq4",
      "numero": "RC 2026/0004",
      "data": "2026-09-23",
      "viaturaId": "v5",
      "posto": "Petromoc 25 de Setembro",
      "litros": 31,
      "precoLitro": 86.97,
      "finalidade": "Entrega ao cliente",
      "estado": "paga",
      "dataAbast": "2026-09-23",
      "km": 54280,
      "litrosReais": 31,
      "precoReal": 86.97,
      "valorReal": 2696.07,
      "abastecimentoId": "a13",
      "dataVerif": "2026-09-23",
      "faturaNr": "FT 2026/A/2231",
      "reciboNr": "RE 2026/A/1904",
      "dataPag": "2026-09-24",
      "valorPago": 2696.07,
      "formaPag": "M-Pesa",
      "postoId": "p2",
      "combustivel": "Gasolina"
    },
    {
      "id": "rq5",
      "numero": "RC 2026/0005",
      "data": "2026-09-15",
      "viaturaId": "v1",
      "motoristaId": "m4",
      "posto": "Petromoc 25 de Setembro",
      "litros": 60,
      "precoLitro": 87.97,
      "finalidade": "Preparar viatura para reserva",
      "estado": "pendente",
      "postoId": "p2",
      "combustivel": "Diesel"
    },
    {
      "id": "rq6",
      "numero": "RC 2026/0006",
      "data": "2026-09-24",
      "viaturaId": "v6",
      "posto": "TotalEnergies Marginal",
      "litros": 70,
      "precoLitro": 87.5,
      "finalidade": "Transfer aeroporto",
      "estado": "pendente",
      "postoId": "p4",
      "combustivel": "Diesel"
    },
    {
      "id": "rq7",
      "numero": "RC 2026/0007",
      "data": "2026-09-18",
      "viaturaId": "v3",
      "posto": "Petromoc 25 de Setembro",
      "litros": 80,
      "precoLitro": 87.97,
      "finalidade": "Viatura foi para a oficina",
      "estado": "anulada",
      "postoId": "p2",
      "combustivel": "Diesel"
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
      "posto": "Petromoc Samora Machel",
      "postoId": "p1"
    },
    {
      "id": "a02",
      "viaturaId": "v1",
      "data": "2026-08-29",
      "km": 67820,
      "litros": 58,
      "precoLitro": 87.97,
      "posto": "TotalEnergies Marginal",
      "postoId": "p4"
    },
    {
      "id": "a03",
      "viaturaId": "v1",
      "data": "2026-09-15",
      "km": 68430,
      "litros": 61,
      "precoLitro": 87.97,
      "posto": "Petromoc Samora Machel",
      "postoId": "p1"
    },
    {
      "id": "a04",
      "viaturaId": "v2",
      "data": "2026-08-20",
      "km": 89900,
      "litros": 42,
      "precoLitro": 86.97,
      "posto": "Galp Coalane",
      "postoId": "p3"
    },
    {
      "id": "a05",
      "viaturaId": "v2",
      "data": "2026-09-06",
      "km": 90560,
      "litros": 45,
      "precoLitro": 86.97,
      "posto": "TotalEnergies Marginal",
      "postoId": "p4"
    },
    {
      "id": "a06",
      "viaturaId": "v2",
      "data": "2026-09-22",
      "km": 91180,
      "litros": 43,
      "precoLitro": 86.97,
      "posto": "Petromoc 25 de Setembro",
      "requisicaoId": "rq3",
      "postoId": "p2"
    },
    {
      "id": "a07",
      "viaturaId": "v3",
      "data": "2026-08-05",
      "km": 141200,
      "litros": 80,
      "precoLitro": 87.97,
      "posto": "Petromoc Samora Machel",
      "postoId": "p1"
    },
    {
      "id": "a08",
      "viaturaId": "v3",
      "data": "2026-08-30",
      "km": 142000,
      "litros": 88,
      "precoLitro": 87.97,
      "posto": "Engen Chuabo Dembe",
      "postoId": "p5"
    },
    {
      "id": "a09",
      "viaturaId": "v3",
      "data": "2026-09-14",
      "km": 142780,
      "litros": 86,
      "precoLitro": 87.97,
      "posto": "Engen Chuabo Dembe",
      "postoId": "p5"
    },
    {
      "id": "a10",
      "viaturaId": "v4",
      "data": "2026-08-25",
      "km": 31100,
      "litros": 55,
      "precoLitro": 87.97,
      "posto": "Galp Coalane",
      "requisicaoId": "rq1",
      "postoId": "p3"
    },
    {
      "id": "a11",
      "viaturaId": "v4",
      "data": "2026-09-12",
      "km": 31880,
      "litros": 70,
      "precoLitro": 87.97,
      "posto": "Galp Coalane",
      "requisicaoId": "rq2",
      "postoId": "p3"
    },
    {
      "id": "a12",
      "viaturaId": "v5",
      "data": "2026-09-01",
      "km": 53700,
      "litros": 28,
      "precoLitro": 86.97,
      "posto": "TotalEnergies Marginal",
      "postoId": "p4"
    },
    {
      "id": "a13",
      "viaturaId": "v5",
      "data": "2026-09-23",
      "km": 54280,
      "litros": 31,
      "precoLitro": 86.97,
      "posto": "Petromoc 25 de Setembro",
      "requisicaoId": "rq4",
      "postoId": "p2"
    },
    {
      "id": "a14",
      "viaturaId": "v6",
      "data": "2026-08-14",
      "km": 187500,
      "litros": 65,
      "precoLitro": 87.97,
      "posto": "Engen Chuabo Dembe",
      "postoId": "p5"
    },
    {
      "id": "a15",
      "viaturaId": "v6",
      "data": "2026-08-18",
      "km": 188580,
      "litros": 118,
      "precoLitro": 87.97,
      "posto": "Petromoc Nicoadala",
      "postoId": "p6"
    },
    {
      "id": "a16",
      "viaturaId": "v4",
      "data": "2026-07-08",
      "km": 29600,
      "litros": 50,
      "precoLitro": 86.5,
      "posto": "Galp Coalane",
      "postoId": "p3"
    },
    {
      "id": "a17",
      "viaturaId": "v4",
      "data": "2026-07-27",
      "km": 30320,
      "litros": 52.5,
      "precoLitro": 86.5,
      "posto": "Galp Coalane",
      "postoId": "p3"
    }
  ],
  "despesas": [
    {
      "id": "d1",
      "viaturaId": "v6",
      "data": "2026-08-16",
      "categoria": "Portagem",
      "valor": 400,
      "descricao": "Portagem na estrada Quelimane–Mocuba (ida e volta)"
    },
    {
      "id": "d2",
      "viaturaId": "v1",
      "data": "2026-09-03",
      "categoria": "Portagem",
      "valor": 160,
      "descricao": "Ponte sobre o rio dos Bons Sinais"
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
      "oficina": "Toyota Moçambique (Quelimane)",
      "custo": 9800
    },
    {
      "id": "s2",
      "viaturaId": "v4",
      "data": "2026-07-15",
      "km": 30000,
      "tipo": "Revisão geral",
      "oficina": "Oficina Auto Zambézia",
      "custo": 18500
    },
    {
      "id": "s3",
      "viaturaId": "v3",
      "data": "2026-09-19",
      "km": 142800,
      "tipo": "Travões (pastilhas e discos)",
      "oficina": "Auto Moz Quelimane",
      "custo": 21400
    },
    {
      "id": "s4",
      "viaturaId": "v5",
      "data": "2026-06-01",
      "km": 50000,
      "tipo": "Óleo e filtros",
      "oficina": "Oficina Central de Quelimane",
      "custo": 5200
    }
  ],
  "clientes": [
    {
      "id": "c1",
      "nome": "Construções Zambeze, Lda",
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
      "carta": "ZB-0098765",
      "cartaValidade": "2029-03-14"
    },
    {
      "id": "c3",
      "nome": "Associação Saúde Comunitária da Zambézia",
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
      "carta": "ZB-0123456",
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
      "tarifaMotorista": 1500,
      "checkEntrega": {
        "data": "2026-09-22",
        "hora": "08:40",
        "por": "Pedro Macamo",
        "porId": "u4",
        "km": 91180,
        "combustivel": "Cheio",
        "itens": {
          "Carroçaria sem riscos nem amolgadelas": "nao",
          "Vidros e para-brisas sem danos": "sim",
          "Espelhos em bom estado": "sim",
          "Faróis, piscas e luzes de travão a funcionar": "sim",
          "Pneus em bom estado": "sim",
          "Pneu sobresselente": "sim",
          "Macaco e chave de rodas": "sim",
          "2 triângulos e colete refletor": "sim",
          "Extintor": "sim",
          "Interior e bancos limpos e sem danos": "sim",
          "Ar condicionado a funcionar": "sim",
          "Rádio / som a funcionar": "sim",
          "Documentos na viatura (livrete, seguro, inspeção)": "sim",
          "Viatura limpa": "sim"
        },
        "notas": {
          "Carroçaria sem riscos nem amolgadelas": "Risco de 10 cm no para-choques traseiro, lado direito (já existente)"
        },
        "obs": "",
        "pessoa": "Armando Sitoe",
        "clienteConfirmou": true
      }
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
      "condutores": "Tiago Nhantumbo",
      "checkEntrega": {
        "data": "2026-09-20",
        "hora": "14:15",
        "por": "Pedro Macamo",
        "porId": "u4",
        "km": 54280,
        "combustivel": "3/4",
        "itens": {
          "Carroçaria sem riscos nem amolgadelas": "sim",
          "Vidros e para-brisas sem danos": "sim",
          "Espelhos em bom estado": "sim",
          "Faróis, piscas e luzes de travão a funcionar": "sim",
          "Pneus em bom estado": "sim",
          "Pneu sobresselente": "sim",
          "Macaco e chave de rodas": "sim",
          "2 triângulos e colete refletor": "sim",
          "Extintor": "sim",
          "Interior e bancos limpos e sem danos": "sim",
          "Ar condicionado a funcionar": "sim",
          "Rádio / som a funcionar": "sim",
          "Documentos na viatura (livrete, seguro, inspeção)": "sim",
          "Viatura limpa": "sim"
        },
        "notas": {},
        "obs": "",
        "pessoa": "Tiago Nhantumbo",
        "clienteConfirmou": true
      }
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
      "tarifaMotorista": 1800,
      "descontoTipo": "pct",
      "descontoValor": 10,
      "descontoMotivo": "Cliente frequente"
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
      "condutores": "Eng. Abel Cossa",
      "devolvidoEm": "2026-09-10"
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
      "condutores": "Sr. Jaime Chissano",
      "devolvidoEm": "2026-08-18"
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
      "extras": 1500,
      "extrasDesc": "Limpeza interior",
      "condutores": "",
      "motoristaId": "m2",
      "tarifaMotorista": 1800,
      "devolvidoEm": "2026-09-18",
      "checkEntrega": {
        "data": "2026-09-12",
        "hora": "09:10",
        "por": "Pedro Macamo",
        "porId": "u4",
        "km": 31100,
        "combustivel": "Cheio",
        "itens": {
          "Carroçaria sem riscos nem amolgadelas": "sim",
          "Vidros e para-brisas sem danos": "sim",
          "Espelhos em bom estado": "sim",
          "Faróis, piscas e luzes de travão a funcionar": "sim",
          "Pneus em bom estado": "sim",
          "Pneu sobresselente": "sim",
          "Macaco e chave de rodas": "sim",
          "2 triângulos e colete refletor": "sim",
          "Extintor": "sim",
          "Interior e bancos limpos e sem danos": "sim",
          "Ar condicionado a funcionar": "sim",
          "Rádio / som a funcionar": "sim",
          "Documentos na viatura (livrete, seguro, inspeção)": "sim",
          "Viatura limpa": "sim"
        },
        "notas": {},
        "obs": "",
        "pessoa": "Celso Mabunda",
        "clienteConfirmou": true
      },
      "checkDevolucao": {
        "data": "2026-09-18",
        "hora": "17:30",
        "por": "Pedro Macamo",
        "porId": "u4",
        "km": 31640,
        "combustivel": "1/2",
        "itens": {
          "Carroçaria sem riscos nem amolgadelas": "sim",
          "Vidros e para-brisas sem danos": "sim",
          "Espelhos em bom estado": "sim",
          "Faróis, piscas e luzes de travão a funcionar": "sim",
          "Pneus em bom estado": "sim",
          "Pneu sobresselente": "sim",
          "Macaco e chave de rodas": "sim",
          "2 triângulos e colete refletor": "sim",
          "Extintor": "sim",
          "Interior e bancos limpos e sem danos": "sim",
          "Ar condicionado a funcionar": "sim",
          "Rádio / som a funcionar": "sim",
          "Documentos na viatura (livrete, seguro, inspeção)": "sim",
          "Viatura limpa": "nao"
        },
        "notas": {
          "Viatura limpa": "Interior com muita poeira e lama"
        },
        "obs": "",
        "pessoa": "Celso Mabunda",
        "clienteConfirmou": true
      }
    },
    {
      "id": "r7",
      "clienteId": "c2",
      "viaturaId": "v3",
      "inicio": "2026-09-20",
      "fim": "2026-09-23",
      "tarifa": 7500,
      "caucao": 20000,
      "estado": "cancelada",
      "condutores": "Helena Macuácua",
      "motivoCancel": "Viatura indisponível (avaria ou oficina)",
      "obsCancel": "Land Cruiser entrou na oficina para revisão geral; cliente ficou com o Corolla.",
      "canceladaEm": "2026-09-19",
      "canceladaPor": "Pedro Macamo"
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
          "desc": "Aluguer Toyota Hiace 15 lugares (ADR 342 ZB), 15/08 a 18/08",
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
          "desc": "Aluguer Nissan NP300 Hardbody (AHB 128 ZB), 01/09 a 10/09",
          "qtd": 9,
          "preco": 4000
        }
      ]
    }
  ],
  "utilizadores": [
    {
      "id": "u1",
      "nome": "Ana Sitoe",
      "email": "ana.sitoe@exemplo.co.mz",
      "perfil": "admin",
      "estado": "ativo"
    },
    {
      "id": "u2",
      "nome": "Carlos Mondlane",
      "email": "carlos.mondlane@exemplo.co.mz",
      "perfil": "gestor",
      "estado": "ativo"
    },
    {
      "id": "u3",
      "nome": "Luísa Chongo",
      "email": "luisa.chongo@exemplo.co.mz",
      "perfil": "contabilista",
      "estado": "ativo"
    },
    {
      "id": "u4",
      "nome": "Pedro Macamo",
      "email": "pedro.macamo@exemplo.co.mz",
      "perfil": "operador",
      "estado": "ativo"
    },
    {
      "id": "u5",
      "nome": "Direção Geral",
      "email": "direcao@exemplo.co.mz",
      "perfil": "consulta",
      "estado": "ativo"
    }
  ],
  "subsidios": [
    {
      "id": "sb1",
      "motoristaId": "m2",
      "reservaId": "r6",
      "descricao": "Aluguer AHB 128 ZB — Associação Saúde Comunitária da Zambézia",
      "dias": 6,
      "valorDia": 500,
      "valor": 3000,
      "estado": "confirmado",
      "criadoEm": "2026-09-18",
      "criadoPor": "Pedro Macamo",
      "dataPag": "2026-09-19",
      "formaPag": "Numerário",
      "refPag": "Recibo de caixa 0412",
      "pagoPor": "Luísa Chongo",
      "dataConf": "2026-09-19",
      "modoConf": "Assinatura no recibo",
      "obsConf": "Recibo assinado arquivado na pasta de setembro",
      "confPor": "Luísa Chongo"
    },
    {
      "id": "sb2",
      "motoristaId": "m1",
      "reservaId": "r1",
      "descricao": "Adiantamento: aluguer AFX 903 ZB — Helena Macuácua",
      "dias": 7,
      "valorDia": 500,
      "valor": 3500,
      "estado": "pago",
      "criadoEm": "2026-09-22",
      "criadoPor": "Carlos Mondlane",
      "dataPag": "2026-09-22",
      "formaPag": "M-Pesa",
      "refPag": "QK7H2LM9P1",
      "pagoPor": "Luísa Chongo"
    },
    {
      "id": "sb3",
      "motoristaId": "m4",
      "descricao": "Deslocação a Mocuba (requisição RC 2026/0005)",
      "dias": 2,
      "valorDia": 500,
      "valor": 1000,
      "estado": "pendente",
      "criadoEm": "2026-09-15",
      "criadoPor": "Carlos Mondlane"
    }
  ]
};
