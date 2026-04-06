//
//  ContentView.swift
//  Vedic Skyview
//
//  Created by Pritesh Shrivastava on 04/04/26.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        ARViewContainer()
            .ignoresSafeArea()
    }
}

/// Bridges VedicSkyviewController into the SwiftUI scene.
struct ARViewContainer: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> VedicSkyviewController {
        VedicSkyviewController()
    }
    func updateUIViewController(_ uiViewController: VedicSkyviewController, context: Context) {}
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
