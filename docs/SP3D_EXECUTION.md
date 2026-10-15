# São Paulo 3D — implementação controlada

Projeto único: 66675, org896. Não criar outro projeto.
Documento soberano: PRD — São Paulo 3D: réplica fiel da cidade, fornecido por Tony em 15/10/2026. Esta nota não altera nem substitui o PDF original.

## Ordem bloqueante

1. Validar fontes oficiais, versões, licenças e hospedagem/CDN.
2. Piloto de dados no eixo sudoeste: contornos oficiais + MDS e MDT LiDAR. Não começar a cena visual antes de provar a fidelidade.
3. Motor three.js/React com tiles progressivos e LOD0/1/2.
4. Produto com catálogo, admin, imóveis e fluxo até lead.
5. QA, precisão, desempenho, licenças e segurança antes de publicar.

## Dados reais

CRS EPSG:31983, origem local no Marco Zero validada. Base pretendida 2020. Alturas medidas por superfície menos terreno e mediana no contorno; sem estimativas por andares quando houver medição. Falta de dado é lacuna: nunca substituir por prédio aleatório, altura inventada ou rua genérica.

Geometria em arquivos binários comprimidos de até 1MB por tile; CDN versionada /tiles/v1/. Não guardar a cidade em registro JSON/texto PocketBase. Banco guarda conteúdo editorial e referências. Falta validar capacidade de armazenamento/CDN e os direitos dos derivados.

## Direção visual original

Entardecer roxo/laranja com névoa; cidade azul-ardósia e janelas procedurais; vias âmbar por hierarquia; parques e água escuros; empreendimentos dourados com farol; painéis escuros translúcidos e tipografia fina. Não copiar a marca do vídeo de referência.

## Backend previsto

sp3d_empreendimentos, sp3d_pois, sp3d_distancias, sp3d_marcos, sp3d_config, sp3d_leads, sp3d_eventos. Público acessa somente conteúdo permitido; escrita editorial só admin; signup fechado; leads privados via hook antispam; eventos protegidos. Catálogo /backend/v1/sp3d/catalogo com allowlist explícita.

## Aceites ainda NÃO comprovados

Cobertura >=98%; 100 prédios checados com >=90 dentro de 3m ou 10%; 50 posições com erro <=2m; cerca de 40 marcos reconhecidos por cinco paulistanos; primeira imagem <=3s em 4G e pacote <=5MB; >=50fps notebook e >=30fps celular; memória <=1,5GB/600MB; fluxo completo até lead e cadastro admin sem republicar.

## Questões abertas do PRD

Marca/cliente inicial; imóveis e mídia fornecidos pelo cliente; CDN; licenças; captura de contato. Não inventar valores ou fornecedores aprovados. A previsão de dez semanas no diagrama não é um prazo assumido sem validar os recursos.

Estado: fundação e validação de dados. Não publicado. Um template ou um piloto não equivalem à réplica completa validada.
