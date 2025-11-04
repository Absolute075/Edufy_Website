package com.edufy.user.integration;

import lombok.extern.slf4j.Slf4j;
import net.schmizz.sshj.SSHClient;
import net.schmizz.sshj.common.IOUtils;
import net.schmizz.sshj.connection.channel.direct.Session;
import net.schmizz.sshj.sftp.SFTPClient;
import net.schmizz.sshj.transport.verification.PromiscuousVerifier;
import net.schmizz.sshj.userauth.keyprovider.KeyProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class SftpUploader {

    @Value("${storage.sftp.host}")
    private String host;

    @Value("${storage.sftp.port:22}")
    private int port;

    @Value("${storage.sftp.user}")
    private String user;

    @Value("${storage.sftp.keyPath}")
    private String keyPath;

    @Value("${storage.sftp.keyPassphrase:}")
    private String keyPassphrase;

    @Value("${storage.sftp.destDir}")
    private String destDir;

    public void upload(InputStream in, String remoteFileName) throws IOException {
        SSHClient ssh = new SSHClient();
        // WARNING: PromiscuousVerifier disables host key verification; consider configuring known_hosts in prod
        ssh.addHostKeyVerifier(new PromiscuousVerifier());
        ssh.connect(host, port);
        try {
            KeyProvider keys = keyPassphrase != null && !keyPassphrase.isBlank()
                    ? ssh.loadKeys(keyPath, keyPassphrase)
                    : ssh.loadKeys(keyPath);
            ssh.authPublickey(user, keys);

            try (SFTPClient sftp = ssh.newSFTPClient()) {
                String remotePath = normalize(destDir) + "/" + remoteFileName;
                sftp.mkdirs(normalize(destDir));
                sftp.put(in, remotePath);
                log.info("Uploaded avatar to {} via SFTP", remotePath);
            }
        } finally {
            try { ssh.disconnect(); } catch (Exception ignored) {}
        }
    }

    private String normalize(String p){
        if (p == null) return "";
        return p.endsWith("/") ? p.substring(0, p.length()-1) : p;
    }
}
