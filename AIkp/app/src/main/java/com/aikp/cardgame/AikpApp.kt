package com.aikp.cardgame

import android.app.Application
import com.aikp.cardgame.data.GameRepository
import com.aikp.cardgame.data.db.AppDatabase

class AikpApp : Application() {
    lateinit var repository: GameRepository
        private set

    override fun onCreate() {
        super.onCreate()
        repository = GameRepository(AppDatabase.get(this))
    }
}
