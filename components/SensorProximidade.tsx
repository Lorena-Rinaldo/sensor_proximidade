import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

import {
  activate,
  addProximityStateListener,
  deactivate,
  isAvailableAsync,
} from "expo-proximity";

// --------------------------------------------------
// CONFIGURAÇÕES
// --------------------------------------------------

const TEMPO_PARA_PAUSAR = 3000;

// Música de teste.
// Depois podemos trocar pela música do seu catálogo.
const MUSICA = {
  titulo: "Blinding Lights",
  artista: "The Weeknd",

  imagem: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",

  audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
};

// --------------------------------------------------
// COMPONENTE
// --------------------------------------------------

export default function SensorProximidade() {
  // ------------------------------------------------
  // PLAYER
  // ------------------------------------------------

  const player = useAudioPlayer(MUSICA.audio);

  const status = useAudioPlayerStatus(player);

  // ------------------------------------------------
  // ESTADOS DO SENSOR
  // ------------------------------------------------

  const [sensorDisponivel, setSensorDisponivel] = useState<boolean | null>(
    null,
  );

  const [objetoProximo, setObjetoProximo] = useState(false);

  const [contando, setContando] = useState(false);

  const [segundosRestantes, setSegundosRestantes] = useState(3);

  // ------------------------------------------------
  // TIMER
  // ------------------------------------------------

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ------------------------------------------------
  // CONFIGURAÇÃO DO SENSOR
  // ------------------------------------------------

  useEffect(() => {
    let subscription: any = null;

    async function iniciarSensor() {
      try {
        // Verifica se o aparelho possui sensor
        const disponivel = await isAvailableAsync();

        setSensorDisponivel(disponivel);

        if (!disponivel) {
          return;
        }

        // Liga o sensor
        await activate();

        // Escuta mudanças no sensor
        subscription = addProximityStateListener((event) => {
          const estaProximo = event.proximityState;

          setObjetoProximo(estaProximo);

          if (estaProximo) {
            iniciarContagem();
          } else {
            cancelarContagem();
          }
        });
      } catch (error) {
        console.log("Erro ao iniciar sensor:", error);

        setSensorDisponivel(false);
      }
    }

    iniciarSensor();

    // ------------------------------------------------
    // LIMPEZA
    // ------------------------------------------------

    return () => {
      if (subscription) {
        subscription.remove();
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }

      deactivate();
    };
  }, []);

  // --------------------------------------------------
  // INICIAR CONTAGEM
  // --------------------------------------------------

  function iniciarContagem() {
    // Evita criar vários timers
    if (timerRef.current) {
      return;
    }

    setContando(true);
    setSegundosRestantes(3);

    // Contador visual
    intervaloRef.current = setInterval(() => {
      setSegundosRestantes((valorAtual) => {
        if (valorAtual <= 1) {
          return 0;
        }

        return valorAtual - 1;
      });
    }, 1000);

    // Timer principal
    timerRef.current = setTimeout(() => {
      // PAUSA A MÚSICA
      player.pause();

      setContando(false);

      setSegundosRestantes(3);

      timerRef.current = null;

      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);

        intervaloRef.current = null;
      }
    }, TEMPO_PARA_PAUSAR);
  }

  // --------------------------------------------------
  // CANCELAR CONTAGEM
  // --------------------------------------------------

  function cancelarContagem() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);

      timerRef.current = null;
    }

    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);

      intervaloRef.current = null;
    }

    setContando(false);

    setSegundosRestantes(3);
  }

  // --------------------------------------------------
  // PLAY / PAUSE MANUAL
  // --------------------------------------------------

  function alternarMusica() {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  }

  // --------------------------------------------------
  // REINICIAR MÚSICA
  // --------------------------------------------------

  async function reiniciarMusica() {
    await player.seekTo(0);

    player.play();
  }

  // --------------------------------------------------
  // FORMATAR TEMPO
  // --------------------------------------------------

  function formatarTempo(segundos: number) {
    if (!segundos || isNaN(segundos)) {
      return "0:00";
    }

    const minutos = Math.floor(segundos / 60);

    const segundosRestantes = Math.floor(segundos % 60);

    return `${minutos}:${segundosRestantes.toString().padStart(2, "0")}`;
  }

  // --------------------------------------------------
  // PROGRESSO DA MÚSICA
  // --------------------------------------------------

  const progresso =
    status.duration > 0 ? status.currentTime / status.duration : 0;

  // --------------------------------------------------
  // SENSOR CARREGANDO
  // --------------------------------------------------

  if (sensorDisponivel === null) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#FF38D1" />

          <Text style={styles.carregando}>Verificando sensor...</Text>
        </View>
      </View>
    );
  }

  // --------------------------------------------------
  // SENSOR NÃO DISPONÍVEL
  // --------------------------------------------------

  if (!sensorDisponivel) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.topo}>
            <View>
              <Text style={styles.label}>POP HITS</Text>

              <Text style={styles.tituloSensor}>Sensor de proximidade</Text>
            </View>

            <View style={styles.indicadorErro} />
          </View>

          <View style={styles.erroArea}>
            <Text style={styles.iconeErro}>!</Text>

            <Text style={styles.erroTitulo}>Sensor indisponível</Text>

            <Text style={styles.erroTexto}>
              Este dispositivo não possui um sensor de proximidade compatível.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // --------------------------------------------------
  // TELA PRINCIPAL
  // --------------------------------------------------

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* ------------------------------------------
            CABEÇALHO
        ------------------------------------------ */}

        <View style={styles.topo}>
          <TouchableOpacity style={styles.botaoVoltar}>
            <Text style={styles.voltar}>‹</Text>
          </TouchableOpacity>

          <View style={styles.infoTopo}>
            <Text style={styles.nowPlaying}>NOW PLAYING</Text>

            <Text style={styles.sensorAtivo}>● SENSOR ATIVO</Text>
          </View>

          <View
            style={[styles.indicador, objetoProximo && styles.indicadorAtivo]}
          />
        </View>

        {/* ------------------------------------------
            CAPA
        ------------------------------------------ */}

        <View style={styles.capaContainer}>
          <Image
            source={{
              uri: MUSICA.imagem,
            }}
            style={styles.capa}
          />
        </View>

        {/* ------------------------------------------
            INFORMAÇÕES DA MÚSICA
        ------------------------------------------ */}

        <View style={styles.informacoes}>
          <View>
            <Text style={styles.nomeMusica}>{MUSICA.titulo}</Text>

            <Text style={styles.nomeArtista}>{MUSICA.artista}</Text>
          </View>

          <TouchableOpacity>
            <Text style={styles.coracao}>♡</Text>
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------
            BARRA DE PROGRESSO
        ------------------------------------------ */}

        <View style={styles.progressoContainer}>
          <View style={styles.progressoFundo}>
            <View
              style={[
                styles.progresso,
                {
                  width: `${Math.min(progresso * 100, 100)}%`,
                },
              ]}
            />
          </View>

          <View style={styles.tempos}>
            <Text style={styles.tempo}>
              {formatarTempo(status.currentTime)}
            </Text>

            <Text style={styles.tempo}>{formatarTempo(status.duration)}</Text>
          </View>
        </View>

        {/* ------------------------------------------
            CONTROLES
        ------------------------------------------ */}

        <View style={styles.controles}>
          <TouchableOpacity>
            <Text style={styles.controlePequeno}>↶</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.controle}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botaoPlay} onPress={alternarMusica}>
            <Text style={styles.playIcone}>{status.playing ? "Ⅱ" : "▶"}</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.controle}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={reiniciarMusica}>
            <Text style={styles.controlePequeno}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* ------------------------------------------
            ÁREA DO SENSOR
        ------------------------------------------ */}

        <View
          style={[styles.sensorCard, objetoProximo && styles.sensorCardAtivo]}
        >
          <View
            style={[
              styles.sensorIcone,

              objetoProximo && styles.sensorIconeAtivo,
            ]}
          >
            <Text style={styles.sensorIconeTexto}>◉</Text>
          </View>

          <View style={styles.sensorTextoArea}>
            <Text style={styles.sensorTitulo}>
              {objetoProximo ? "Objeto detectado" : "Sensor de proximidade"}
            </Text>

            <Text style={styles.sensorDescricao}>
              {contando
                ? `Pausando em ${segundosRestantes}s...`
                : objetoProximo
                  ? "Mantenha próximo para pausar"
                  : "Aproxime algo do sensor"}
            </Text>
          </View>

          <View
            style={[
              styles.sensorBolinha,

              objetoProximo && styles.sensorBolinhaAtiva,
            ]}
          />
        </View>

        {/* ------------------------------------------
            INFORMAÇÃO
        ------------------------------------------ */}

        <Text style={styles.instrucao}>
          Aproxime um objeto do sensor por 3 segundos para pausar a música.
        </Text>

        <View style={styles.demonstracao}>
          <Text style={styles.demonstracaoTitulo}>Demonstração</Text>

          <Image
            source={require("../assets/images/demonstracao.gif")}
            style={styles.demonstracaoImagem}
          />

          <Text style={styles.biblioteca}>
            Sensor fornecido por expo-proximity
          </Text>
        </View>
      </View>
    </View>
  );
}

// ==================================================
// ESTILOS
// ==================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: "#B86DE8",

    justifyContent: "center",

    padding: 18,
  },

  card: {
    backgroundColor: "#32135F",

    borderRadius: 30,

    padding: 20,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 10,
    },

    shadowOpacity: 0.3,

    shadowRadius: 15,

    elevation: 10,
  },

  // -----------------------------------------------
  // TOPO
  // -----------------------------------------------

  topo: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 20,
  },

  botaoVoltar: {
    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor: "#452274",

    alignItems: "center",

    justifyContent: "center",
  },

  voltar: {
    color: "#FFFFFF",

    fontSize: 28,

    marginTop: -4,
  },

  infoTopo: {
    alignItems: "center",
  },

  nowPlaying: {
    color: "#BDA5D8",

    fontSize: 10,

    fontWeight: "700",

    letterSpacing: 2,
  },

  sensorAtivo: {
    color: "#FF45D3",

    fontSize: 8,

    fontWeight: "700",

    marginTop: 3,
  },

  indicador: {
    width: 11,

    height: 11,

    borderRadius: 6,

    backgroundColor: "#6D5A7F",
  },

  indicadorAtivo: {
    backgroundColor: "#FF39D1",
  },

  indicadorErro: {
    width: 11,

    height: 11,

    borderRadius: 6,

    backgroundColor: "#FF4D75",
  },

  // -----------------------------------------------
  // CAPA
  // -----------------------------------------------

  capaContainer: {
    alignItems: "center",
  },

  capa: {
    width: 230,

    height: 230,

    borderRadius: 24,
  },

  // -----------------------------------------------
  // INFORMAÇÕES
  // -----------------------------------------------

  informacoes: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginTop: 20,
  },

  nomeMusica: {
    color: "#FFFFFF",

    fontSize: 24,

    fontWeight: "800",
  },

  nomeArtista: {
    color: "#BDA5D8",

    fontSize: 14,

    marginTop: 4,
  },

  coracao: {
    color: "#FFFFFF",

    fontSize: 30,
  },

  // -----------------------------------------------
  // PROGRESSO
  // -----------------------------------------------

  progressoContainer: {
    marginTop: 18,
  },

  progressoFundo: {
    width: "100%",

    height: 4,

    backgroundColor: "#644784",

    borderRadius: 5,

    overflow: "hidden",
  },

  progresso: {
    height: "100%",

    backgroundColor: "#FF38D1",

    borderRadius: 5,
  },

  tempos: {
    flexDirection: "row",

    justifyContent: "space-between",

    marginTop: 7,
  },

  tempo: {
    color: "#A994BF",

    fontSize: 10,
  },

  // -----------------------------------------------
  // CONTROLES
  // -----------------------------------------------

  controles: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginTop: 15,

    paddingHorizontal: 20,
  },

  controle: {
    color: "#FFFFFF",

    fontSize: 40,

    fontWeight: "300",
  },

  controlePequeno: {
    color: "#D0BFDF",

    fontSize: 22,
  },

  botaoPlay: {
    width: 58,

    height: 58,

    borderRadius: 29,

    backgroundColor: "#FF38D1",

    alignItems: "center",

    justifyContent: "center",

    shadowColor: "#FF38D1",

    shadowOpacity: 0.5,

    shadowRadius: 10,

    elevation: 7,
  },

  playIcone: {
    color: "#FFFFFF",

    fontSize: 21,

    fontWeight: "900",
  },

  // -----------------------------------------------
  // SENSOR
  // -----------------------------------------------

  sensorCard: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#43216F",

    borderRadius: 18,

    padding: 13,

    marginTop: 22,

    borderWidth: 1,

    borderColor: "#5D3C83",
  },

  sensorCardAtivo: {
    borderColor: "#FF38D1",

    backgroundColor: "#4C2175",
  },

  sensorIcone: {
    width: 43,

    height: 43,

    borderRadius: 22,

    backgroundColor: "#5A3284",

    alignItems: "center",

    justifyContent: "center",
  },

  sensorIconeAtivo: {
    backgroundColor: "#FF38D1",
  },

  sensorIconeTexto: {
    color: "#FFFFFF",

    fontSize: 20,
  },

  sensorTextoArea: {
    flex: 1,

    marginLeft: 12,
  },

  sensorTitulo: {
    color: "#FFFFFF",

    fontSize: 13,

    fontWeight: "700",
  },

  sensorDescricao: {
    color: "#BCA6D0",

    fontSize: 10,

    marginTop: 3,
  },

  sensorBolinha: {
    width: 9,

    height: 9,

    borderRadius: 5,

    backgroundColor: "#776387",
  },

  sensorBolinhaAtiva: {
    backgroundColor: "#FF38D1",
  },

  // -----------------------------------------------
  // INSTRUÇÃO
  // -----------------------------------------------

  instrucao: {
    color: "#A994BF",

    textAlign: "center",

    fontSize: 10,

    lineHeight: 15,

    marginTop: 15,
  },

  demonstracao: {
    alignItems: "center",

    marginTop: 18,
  },

  demonstracaoTitulo: {
    color: "#FFFFFF",

    fontSize: 13,

    fontWeight: "700",

    marginBottom: 8,
  },

  demonstracaoImagem: {
    width: "100%",

    height: 150,

    borderRadius: 14,
  },

  biblioteca: {
    color: "#BDA5D8",

    fontSize: 10,

    marginTop: 8,
  },

  // -----------------------------------------------
  // CARREGANDO
  // -----------------------------------------------

  carregando: {
    color: "#FFFFFF",

    textAlign: "center",

    marginTop: 15,

    fontSize: 14,
  },

  // -----------------------------------------------
  // ERRO
  // -----------------------------------------------

  erroArea: {
    alignItems: "center",

    paddingVertical: 35,
  },

  iconeErro: {
    width: 55,

    height: 55,

    borderRadius: 28,

    backgroundColor: "#FF4D75",

    color: "#FFFFFF",

    textAlign: "center",

    fontSize: 35,

    fontWeight: "800",

    lineHeight: 55,
  },

  erroTitulo: {
    color: "#FFFFFF",

    fontSize: 18,

    fontWeight: "700",

    marginTop: 15,
  },

  erroTexto: {
    color: "#BCA6D0",

    textAlign: "center",

    fontSize: 12,

    lineHeight: 18,

    marginTop: 8,
  },

  tituloSensor: {
    color: "#FFFFFF",

    fontSize: 18,

    fontWeight: "700",

    marginTop: 3,
  },
});
