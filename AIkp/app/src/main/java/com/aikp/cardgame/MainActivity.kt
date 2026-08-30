package com.aikp.cardgame

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.aikp.cardgame.ui.AppViewModel
import com.aikp.cardgame.ui.screens.AikpNav
import com.aikp.cardgame.ui.theme.AikpTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as AikpApp
        setContent {
            AikpTheme {
                val vm: AppViewModel = viewModel(factory = AppViewModel.factory(app.repository))
                val state by vm.uiState.collectAsStateWithLifecycle()
                AikpNav(
                    state = state,
                    onClearMessage = vm::clearMessage,
                    onCreateCard = vm::createCard,
                    onCreateWorld = vm::createWorld,
                    onStartMatch = vm::startMatch,
                    onCancelQueue = vm::cancelQueue,
                    onRefreshLobby = vm::refreshLobby,
                    onUpdateNickname = vm::updateNickname,
                    onClaimCharacter = vm::claimWorldCharacter,
                    onLogin = vm::login,
                    onRegister = vm::register,
                    onLogout = vm::logout
                )
            }
        }
    }
}
