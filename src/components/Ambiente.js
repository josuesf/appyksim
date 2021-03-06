import React, { Component } from 'react';
import {
    ScrollView,
    Text,
    View,
    Dimensions,
    FlatList,
    StyleSheet,
    TouchableOpacity
} from 'react-native'
import { NavigationActions } from 'react-navigation'

import Mesa from '../components/Mesa'
import { ProgressDialog, Dialog } from 'react-native-simple-dialogs';
import store from '../store'
import { URL_WS } from '../Constantes'
import { fetchData } from '../utils/fetchData'

const { width, height } = Dimensions.get('window')
export default class Ambiente extends Component {

    constructor(props) {
        super(props)
        this.state = {
            conectando: true,
            Cod_Ambiente: props.Cod_Ambiente,
            Nom_Ambiente: props.Nom_Ambiente,
            mesas: [],
            OrientationStatus: '',
            Height_Layout: '',
            Width_Layout: '',
            cuentas_mesa: [],
            refreshing: false,
        }

    }
    componentWillMount() {
        this.BuscarMesas()
    }
    BuscarMesas = () => {
        fetchData('/get_mesas_estado', 'POST', {
            usuario: store.getState().nombre_usuario,
            Cod_Ambiente: this.state.Cod_Ambiente
        }, (data, err) => {
            const mesa_dev = data.mesas.find(p => p.Cod_Mesa == 'DEV')
            this.setState({ conectando: false, mesas: [mesa_dev, ...data.mesas.filter(m => m.Cod_Mesa != 'DEV')] })
        })
    }
    SeleccionarMesa = (Cod_Mesa, Nom_Mesa, Estado_Mesa) => {
        const productos_mesa_cambio = this.props.navigation.state.params
        const IdComprobanteOrigen = productos_mesa_cambio ? productos_mesa_cambio.IdComanda : undefined
        if (productos_mesa_cambio && productos_mesa_cambio.Cod_Mesa) {

            //Cambio interno
            // store.dispatch({
            //     type: 'CAMBIO_MESA',
            //     mesa_actual: productos_mesa_cambio.Cod_Mesa,
            //     mesa_nueva: Cod_Mesa
            // })
            fetchData('/cambio_mesa', 'POST', {
                IdComanda: productos_mesa_cambio.IdComanda,
                CodMesaCambio: Cod_Mesa,
                CodUsuario: store.getState().id_usuario
            }, (respuesta, err) => {
                console.log(respuesta, err)
                if (!err) {
                    const vista_mesas = NavigationActions.reset({
                        index: 0,
                        actions: [
                            NavigationActions.navigate({ routeName: 'mesas' })
                        ]
                    })
                    this.props.navigation.dispatch(vista_mesas)
                }
            })
        } else {
            this.setState({ entrando_mesa: true })
            fetchData('/get_productos_by_mesa', 'POST', {
                Cod_Mesa: Cod_Mesa
            }, (data, err) => {
                this.setState({ entrando_mesa: false })
                store.dispatch({
                    type: 'MESA_SELECCIONADA',
                    Cod_Mesa: Cod_Mesa,
                    Nom_Mesa: Nom_Mesa
                })
                if (data.productos_selec.length > 0) {
                    store.dispatch({
                        type: 'ADD_PRODUCTOS_SELECCIONADOS',
                        productos: data.productos_selec.filter(p => p.Id_Referencia == 0),
                        producto_detalles: data.productos_selec.filter(p => p.Id_Referencia != 0)
                    })
                    pedidos = data.productos_selec
                    this.setState({
                        cuentas_mesa: pedidos.filter((p, i) => {
                            if (i + 1 != pedidos.length) {
                                if (p.Numero != pedidos[i + 1].Numero)
                                    return p
                                else
                                    return null
                            } else
                                return p
                        })
                    }, () => {
                        if (this.state.cuentas_mesa.length == 1) {
                            store.dispatch({
                                type: 'ADD_NUMERO_COMPROBANTE',
                                Numero_Comprobante: data.productos_selec[0].Numero,
                                Numero_Cuenta: 1
                            })
                            if (!IdComprobanteOrigen) {
                                this.props.navigation.navigate('main',
                                    {
                                        productos_selec: data.productos_selec
                                        , IdComprobanteOrigen
                                    })
                            } else {
                                this.props.navigation.navigate('pedido', { IdComprobanteOrigen })
                            }

                        } else {
                            this.setState({ OpcionesVisible: true })
                        }
                    })
                } else {

                    store.dispatch({
                        type: 'ADD_NUMERO_COMPROBANTE',
                        Numero_Comprobante: '',
                    })
                    if (!IdComprobanteOrigen) {
                        this.props.navigation.navigate('main',
                            {
                                productos_selec: data.productos_selec
                                , IdComprobanteOrigen
                            })
                    } else {
                        this.props.navigation.navigate('pedido', { IdComprobanteOrigen })
                    }
                }
            })
        }

    }
    AbrirCuentaMesa(Numero, Numero_Cuenta) {
        const productos_mesa_cambio = this.props.navigation.state.params
        const IdComprobanteOrigen = productos_mesa_cambio ? productos_mesa_cambio.IdComanda : undefined
        this.setState({ OpcionesVisible: false })
        store.dispatch({
            type: 'ADD_NUMERO_COMPROBANTE',
            Numero_Comprobante: Numero,
            Numero_Cuenta: Numero_Cuenta
        })
        if (!IdComprobanteOrigen) {
            this.props.navigation.navigate('main',
                {
                    productos_selec: [],
                    IdComprobanteOrigen
                })
        } else {
            this.props.navigation.navigate('pedido', { IdComprobanteOrigen })
        }
    }
    DetectOrientation() {
        if (this.state.Width_Layout > this.state.Height_Layout) {

            // Write Your own code here, which you want to execute on Landscape Mode.
            this.setState({
                OrientationStatus: 'Landscape'
            });
        }
        else {
            // Write Your own code here, which you want to execute on Portrait Mode.
            this.setState({
                OrientationStatus: 'Portrait'
            });
        }
    }
    _onRefresh = () => {
        this.BuscarMesas()
    }
    render() {
        let screenWidth = Dimensions.get('window').width
        let screenHeight = Dimensions.get('window').height
        let { Cod_Ambiente, Nom_Ambiente } = this.state
        return (
            <View onLayout={(event) => this.setState({
                Width_Layout: event.nativeEvent.layout.width,
                Height_Layout: event.nativeEvent.layout.height
            }, () => this.DetectOrientation())}
                key={Cod_Ambiente} style={{
                    backgroundColor: global.tema.primary,//'#78C8B4',
                    flex: 1,
                    //marginTop:20,
                    paddingVertical: 5,
                    width: screenWidth,
                    justifyContent: 'center',
                    alignItems: 'center'

                }}

            >
                <ProgressDialog
                    activityIndicatorColor={"#9b59b6"}
                    activityIndicatorSize="large"
                    visible={this.state.entrando_mesa}
                    title="Conectando"
                    message="Por favor, espere..."
                />
                <Text style={styles.instructions}>{Nom_Ambiente}</Text>
                <FlatList

                    data={this.state.mesas}
                    numColumns={5}
                    keyExtractor={(item, index) => index}
                    renderItem={({ item }) => (
                        <Mesa width_state={this.state.Width_Layout} height_state={this.state.Height_Layout} mesa={item}
                            SeleccionarMesa={() => this.SeleccionarMesa(item.Cod_Mesa, item.Nom_Mesa, item.Estado_Mesa)} />
                    )}
                    refreshing={this.state.refreshing}
                    onRefresh={this._onRefresh}
                />
                <Dialog
                    visible={this.state.OpcionesVisible}
                    onTouchOutside={() => this.setState({ OpcionesVisible: false })}
                    onRequestClose={() => this.setState({ OpcionesVisible: false })} >
                    <ScrollView>
                        {this.state.cuentas_mesa.map((c, i) =>
                            <TouchableOpacity key={i} activeOpacity={0.5} onPress={() => this.AbrirCuentaMesa(c.Numero, i + 1)}
                                style={{ marginVertical: 10, backgroundColor: '#fff' }}>
                                <Text style={{ fontWeight: 'bold', color: 'gray' }}>Cuenta {i + 1}  Total : S/.{parseFloat(c.Total).toFixed(2)}</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </Dialog>
            </View>
        )
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    instructions: {
        color: 'white',
        marginVertical: 10,
        fontWeight: 'bold',
        fontSize: 18
    },
    camera: {
        flex: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        height: Dimensions.get('window').width - 100,
        width: Dimensions.get('window').width,
    },
    rectangle: {
        height: 200,
        width: 200,
        borderWidth: 2,
        borderColor: '#33d9b2',
        backgroundColor: 'transparent',
    },
    rectangleContainer: {
        backgroundColor: 'transparent',
    },
});